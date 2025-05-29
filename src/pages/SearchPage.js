import React, { useState } from 'react';
import { getUserByEmail, createUserCode, verifyUserCode } from '../services/codeService';
import { 
  TextField, 
  Button, 
  Box, 
  Typography, 
  Paper, 
  Alert,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from '@mui/material';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

const SearchPage = () => {
  const [email, setEmail] = useState('');
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);

  const handleSearch = async () => {
    if (!email) {
      setError('الرجاء إدخال البريد الإلكتروني');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const user = await getUserByEmail(email);
      if (user) {
        // التحقق مما إذا كان لدى المستخدم كود مميز
        const codeRef = doc(db, 'userCodes', user.id);
        const codeSnap = await getDoc(codeRef);
        
        setUserData({
          ...user,
          uniqueCode: codeSnap.exists() ? codeSnap.data().code : null,
          hasVerifiedCode: user.hasVerifiedCode || false
        });
      } else {
        setError('لا يوجد مستخدم بهذا البريد الإلكتروني');
        setUserData(null);
      }
    } catch (err) {
      setError(err.message || 'حدث خطأ أثناء البحث');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = () => setOpenDialog(true);
  const handleCloseDialog = () => setOpenDialog(false);

  const handleOpenVerifyDialog = () => {
    setVerifyDialogOpen(true);
    setVerificationResult(null);
    setVerificationCode('');
  };

  const handleCloseVerifyDialog = () => {
    setVerifyDialogOpen(false);
    setVerificationResult(null);
  };

  const handleVerifyCode = async () => {
    if (!userData?.id || !verificationCode) return;

    setLoading(true);
    setError('');
    try {
      const result = await verifyUserCode(userData.id, verificationCode);
      setVerificationResult(result);
      if (result) {
        setSuccess('تم التحقق من الكود بنجاح');
        setUserData(prev => ({ ...prev, hasVerifiedCode: true }));
      } else {
        setError('الكود غير صحيح');
      }
    } catch (err) {
      setError(err.message || 'حدث خطأ أثناء التحقق');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCode = async () => {
    if (!userData?.id) return;

    setLoading(true);
    setError('');
    setSuccess('');
    handleCloseDialog();

    try {
      const result = await createUserCode(userData.id);
      
      setSuccess(`تم إنشاء الكود بنجاح: ${result.code}`);
      setUserData(prev => ({ 
        ...prev, 
        uniqueCode: result.code,
        hasVerifiedCode: false
      }));

    } catch (err) {
      setError(err.message || 'حدث خطأ أثناء إنشاء الكود');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ padding: 3 }}>
      <Paper sx={{ padding: 3, maxWidth: 600, margin: '0 auto' }}>
        <Typography variant="h4" gutterBottom align="center">
          البحث عن الكود المميز
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <TextField
            label="البريد الإلكتروني"
            variant="outlined"
            fullWidth
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="أدخل البريد الإلكتروني"
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            disabled={loading}
          />
          <Button
            variant="contained"
            onClick={handleSearch}
            disabled={loading}
            sx={{ minWidth: 120 }}
          >
            {loading ? <CircularProgress size={24} /> : 'بحث'}
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}

        {userData && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6">نتيجة البحث:</Typography>
            <Box sx={{ 
              mt: 2, 
              p: 2, 
              bgcolor: '#f5f5f5', 
              borderRadius: 1,
              borderLeft: userData.uniqueCode ? '4px solid #4caf50' : '4px solid #f44336'
            }}>
              <Typography><strong>الاسم:</strong> {userData.displayName || 'غير متوفر'}</Typography>
              <Typography><strong>البريد الإلكتروني:</strong> {userData.email}</Typography>
              <Typography sx={{ mt: 1 }}>
                <strong>الكود المميز:</strong>
                <Box component="span" sx={{ 
                  fontFamily: 'monospace',
                  fontSize: '1.2rem',
                  bgcolor: '#eee',
                  p: 1,
                  borderRadius: 1,
                  display: 'inline-block',
                  ml: 1,
                  color: userData.uniqueCode ? '#4caf50' : '#f44336'
                }}>
                  {userData.uniqueCode || 'لا يوجد كود'}
                </Box>
              </Typography>
              <Typography sx={{ mt: 1 }}>
                <strong>حالة التحقق:</strong>
                <Box component="span" sx={{ 
                  fontWeight: 'bold',
                  color: userData.hasVerifiedCode ? '#4caf50' : '#f44336',
                  ml: 1
                }}>
                  {userData.hasVerifiedCode ? 'تم التحقق' : 'غير مؤكد'}
                </Box>
              </Typography>

              <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                {!userData.uniqueCode ? (
                  <Button
                    variant="contained"
                    color="success"
                    onClick={handleOpenDialog}
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} /> : null}
                  >
                    إنشاء كود مميز
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="contained"
                      color="secondary"
                      onClick={handleOpenVerifyDialog}
                      disabled={loading || userData.hasVerifiedCode}
                    >
                      التحقق من الكود
                    </Button>
                  </>
                )}
              </Box>
            </Box>
          </Box>
        )}
      </Paper>

      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>تأكيد إنشاء الكود</DialogTitle>
        <DialogContent>
          <DialogContentText>
            هل أنت متأكد من أنك تريد إنشاء كود جديد للمستخدم {userData?.displayName || userData?.email}؟
            <br />
            سيتم توليد كود فريد ولن يكون بالإمكان استرجاع الكود القديم إذا كان موجوداً.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>إلغاء</Button>
          <Button 
            onClick={handleCreateCode}
            color="success"
            variant="contained"
            disabled={loading}
          >
            {loading ? 'جاري الإنشاء...' : 'تأكيد إنشاء الكود'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={verifyDialogOpen} onClose={handleCloseVerifyDialog}>
        <DialogTitle>التحقق من الكود المميز</DialogTitle>
        <DialogContent>
          <DialogContentText>
            أدخل الكود المميز للمستخدم {userData?.displayName || userData?.email} للتحقق منه:
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="الكود المميز"
            type="text"
            fullWidth
            variant="standard"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
          />
          {verificationResult !== null && (
            <Alert severity={verificationResult ? "success" : "error"} sx={{ mt: 2 }}>
              {verificationResult ? "الكود صحيح وتم التحقق بنجاح" : "الكود غير صحيح"}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseVerifyDialog}>إلغاء</Button>
          <Button
            onClick={handleVerifyCode}
            color="primary"
            variant="contained"
            disabled={loading}
          >
            {loading ? 'جاري التحقق...' : 'تحقق'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SearchPage;