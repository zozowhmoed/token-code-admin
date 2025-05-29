import React, { useState, useEffect } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { Box, Typography, Paper, Button } from '@mui/material';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';

const LoginLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, "loginAttempts"), 
        orderBy("timestamp", "desc")
      );
      const querySnapshot = await getDocs(q);
      const logsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate().toLocaleString()
      }));
      setLogs(logsData);
    } catch (error) {
      console.error("Error fetching logs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const columns = [
    { field: 'timestamp', headerName: 'الوقت', width: 200 },
    { field: 'email', headerName: 'البريد الإلكتروني', width: 200 },
    { 
      field: 'success', 
      headerName: 'الحالة', 
      width: 120,
      renderCell: (params) => (
        <span style={{ color: params.value ? 'green' : 'red' }}>
          {params.value ? 'ناجح' : 'فاشل'}
        </span>
      )
    },
    { field: 'errorMessage', headerName: 'رسالة الخطأ', width: 250 }
  ];

  return (
    <Box sx={{ padding: 3 }}>
      <Paper sx={{ padding: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4">
            سجل محاولات الدخول
          </Typography>
          <Button 
            variant="contained" 
            onClick={fetchLogs}
            disabled={loading}
          >
            تحديث البيانات
          </Button>
        </Box>
        
        <div style={{ height: 600, width: '100%' }}>
          <DataGrid
            rows={logs}
            columns={columns}
            pageSize={10}
            rowsPerPageOptions={[10]}
            loading={loading}
            localeText={{
              noRowsLabel: 'لا توجد سجلات لعرضها',
              footerRowSelected: count => `${count.toLocaleString()} صف محدد`,
            }}
          />
        </div>
      </Paper>
    </Box>
  );
};

export default LoginLogs;