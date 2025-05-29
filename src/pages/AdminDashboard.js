import React, { useState, useEffect, useCallback } from 'react';
import { 
  getAllUsersWithCodes, 
  updateUserCode, 
  createUserCode,
  verifyUserCode,
  getCodeInfo
} from '../services/codeService';
import { 
  DataGrid, 
  gridClasses 
} from '@mui/x-data-grid';
import { 
  Button, 
  TextField, 
  Box, 
  Typography, 
  Paper, 
  Alert,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Snackbar
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [alert, setAlert] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [actionType, setActionType] = useState('create');
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const usersData = await getAllUsersWithCodes();
      setUsers(usersData);
    } catch (error) {
      showError(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const showError = (error) => {
    let message = error.message;
    
    if (message.includes('permission-denied')) {
      message = 'ليس لديك صلاحيات للقيام بهذه العملية';
    } else if (message.includes('network-error')) {
      message = 'مشكلة في الاتصال بالشبكة';
    }
    
    setAlert({ 
      severity: 'error', 
      message 
    });
  };

  const showSuccess = (message) => {
    setAlert({
      severity: 'success',
      message
    });
  };

  const handleOpenDialog = (user, type) => {
    setSelectedUser(user);
    setActionType(type);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedUser(null);
  };

  const handleOpenVerifyDialog = (user) => {
    setSelectedUser(user);
    setVerifyDialogOpen(true);
    setVerificationResult(null);
    setVerificationCode('');
  };

  const handleCloseVerifyDialog = () => {
    setVerifyDialogOpen(false);
    setSelectedUser(null);
    setVerificationResult(null);
  };

  const handleVerifyCode = async () => {
    if (!selectedUser?.id || !verificationCode) return;

    setLoading(true);
    try {
      const result = await verifyUserCode(selectedUser.id, verificationCode);
      setVerificationResult(result);
      if (result) {
        showSuccess('تم التحقق من الكود بنجاح');
        await loadUsers();
      } else {
        showError('الكود غير صحيح');
      }
    } catch (error) {
      showError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCodeAction = async () => {
    if (!selectedUser?.id) return;

    setLoading(true);
    setAlert(null);
    handleCloseDialog();

    try {
      let result;
      if (actionType === 'create') {
        result = await createUserCode(selectedUser.id);
        showSuccess(`تم إنشاء الكود بنجاح: ${result.code}`);
      } else {
        result = await updateUserCode(selectedUser.id);
        showSuccess(`تم تحديث الكود بنجاح: ${result.code}`);
      }
      await loadUsers();
    } catch (error) {
      showError(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.uniqueCode?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
  );

  const columns = [
    { 
      field: 'displayName', 
      headerName: 'الاسم', 
      width: 200,
      renderCell: (params) => (
        <Box sx={{ fontWeight: params.row.uniqueCode ? 'bold' : 'normal' }}>
          {params.value || 'غير معروف'}
        </Box>
      )
    },
    { 
      field: 'email', 
      headerName: 'البريد الإلكتروني', 
      width: 250 
    },
    { 
      field: 'uniqueCode', 
      headerName: 'الكود المميز', 
      width: 300,
      renderCell: (params) => (
        <Box sx={{ 
          fontFamily: 'monospace',
          color: params.value ? '#4caf50' : '#f44336'
        }}>
          {params.value || 'لا يوجد كود'}
        </Box>
      )
    },
    {
      field: 'hasVerifiedCode',
      headerName: 'حالة التحقق',
      width: 150,
      renderCell: (params) => (
        <Box sx={{ 
          color: params.value ? '#4caf50' : '#f44336',
          fontWeight: 'bold'
        }}>
          {params.value ? 'تم التحقق' : 'غير مؤكد'}
        </Box>
      )
    },
    {
      field: 'actions',
      headerName: 'إجراءات',
      width: 400,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          {!params.row.uniqueCode ? (
            <Button
              variant="contained"
              color="success"
              onClick={() => handleOpenDialog(params.row, 'create')}
              disabled={loading}
              size="small"
            >
              إنشاء كود
            </Button>
          ) : (
            <>
              <Button
                variant="contained"
                color="primary"
                onClick={() => handleOpenDialog(params.row, 'update')}
                disabled={loading}
                size="small"
              >
                تحديث الكود
              </Button>
              <Button
                variant="contained"
                color="secondary"
                onClick={() => handleOpenVerifyDialog(params.row)}
                disabled={loading || params.row.hasVerifiedCode}
                size="small"
              >
                التحقق من الكود
              </Button>
            </>
          )}
        </Box>
      ),
    },
  ];

  const handleAlertClose = () => {
    setAlert(null);
  };

  return (
    <Box sx={{ padding: 3 }}>
      <Paper sx={{ padding: 3, marginBottom: 3 }}>
        <Typography variant="h4" gutterBottom>
          لوحة تحكم الأكواد المميزة
        </Typography>
        
        <Snackbar
          open={!!alert}
          autoHideDuration={6000}
          onClose={handleAlertClose}
        >
          <Alert 
            severity={alert?.severity} 
            onClose={handleAlertClose}
            sx={{ mb: 2, width: '100%' }}
          >
            {alert?.message}
          </Alert>
        </Snackbar>
        
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: 2,
          gap: 2
        }}>
          <TextField
            label="بحث"
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ flexGrow: 1 }}
          />
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadUsers}
            disabled={loading}
          >
            تحديث البيانات
          </Button>
        </Box>
        
        <Box sx={{ height: 600, width: '100%' }}>
          <DataGrid
            rows={filteredUsers}
            columns={columns}
            loading={loading}
            pageSize={10}
            rowsPerPageOptions={[10]}
            disableSelectionOnClick
            getRowId={(row) => row.id}
            sx={{
              [`& .${gridClasses.cell}`]: {
                py: 1,
              },
            }}
            localeText={{
              noRowsLabel: 'لا يوجد مستخدمين لعرضهم',
              footerRowSelected: (count) => `${count.toLocaleString()} صف محدد`,
            }}
          />
        </Box>
      </Paper>

      <Dialog open={dialogOpen} onClose={handleCloseDialog}>
        <DialogTitle>
          {actionType === 'create' ? 'إنشاء كود جديد' : 'تحديث الكود المميز'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {actionType === 'create' ? (
              `هل أنت متأكد من أنك تريد إنشاء كود جديد للمستخدم ${selectedUser?.displayName || selectedUser?.email}؟`
            ) : (
              `سيتم توليد كود جديد للمستخدم ${selectedUser?.displayName || selectedUser?.email} وسيتم إلغاء الكود الحالي.`
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>إلغاء</Button>
          <Button
            onClick={handleCodeAction}
            color={actionType === 'create' ? 'success' : 'primary'}
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {actionType === 'create' ? 'إنشاء' : 'تحديث'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={verifyDialogOpen} onClose={handleCloseVerifyDialog}>
        <DialogTitle>
          التحقق من كود المستخدم
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            أدخل الكود المميز للمستخدم {selectedUser?.displayName || selectedUser?.email} للتحقق منه:
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
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            التحقق
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminDashboard;