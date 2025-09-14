import React, { useState, useEffect } from 'react';
import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Chip, Typography, Box, Button, useTheme, ButtonGroup } from '@mui/material';
import PageHeading from './shared/PageHeading';
import { Edit, Delete, Add } from '@mui/icons-material';
import api from '../services/api';
import TransactionForm from './TransactionForm';
import { Transaction } from '../types';

const TransactionList: React.FC = () => {
  const theme = useTheme();
  const darkMode = theme.palette.mode === 'dark';
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | undefined>();
  const [keyword, setKeyword] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchTransactions = async () => {
    try {
      const params: Record<string,string> = {};
      if (keyword.trim()) params.q = keyword.trim();
      if (filterType) params.type = filterType;
      if (filterCategory) params.category = filterCategory;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const resp = await api.get(`/transactions${Object.keys(params).length ? `?${new URLSearchParams(params).toString()}`:''}`);
      const payload: any = resp.data;
      const list: Transaction[] = Array.isArray(payload) ? payload : (Array.isArray(payload?.data)? payload.data: []);
      setTransactions(list);
    } catch (e) { console.error(e); }
  };

  useEffect(()=>{ fetchTransactions(); }, []);

  const handleDelete = async (id: string) => { if(!window.confirm('Delete this transaction?')) return; try { await api.delete(`/transactions/${id}`); fetchTransactions(); } catch(e){ console.error(e);} };
  const handleEdit = (t: Transaction) => { setEditingTransaction(t); setFormOpen(true); };
  const handleFormClose = () => { setFormOpen(false); setEditingTransaction(undefined); };

  return (
    <Box sx={{ minHeight:'100vh', position:'relative', p:3 }}>
      <Box display="flex" flexDirection={{xs:'column', md:'row'}} gap={2} justifyContent="space-between" alignItems={{xs:'stretch', md:'center'}} mb={2}>
  <PageHeading emoji="💰" title="Transaction History" />
  <Box display="flex" gap={1} flexWrap="wrap">
          <input placeholder="Search description..." value={keyword} onChange={e=>setKeyword(e.target.value)} style={{padding:'10px 14px', borderRadius:12, border:'1px solid rgba(255,255,255,0.15)', background: darkMode? 'rgba(255,255,255,0.08)':'rgba(255,255,255,0.6)', backdropFilter:'blur(8px)', color: darkMode? '#fff':'#111', outline:'none', minWidth:180}} />
          <select value={filterType} onChange={e=>setFilterType(e.target.value)} style={{padding:'10px 14px', borderRadius:12, border:'1px solid rgba(255,255,255,0.15)', background: darkMode? 'rgba(255,255,255,0.08)':'rgba(255,255,255,0.6)'}}>
            <option value="">All Types</option><option value="income">Income</option><option value="expense">Expense</option>
          </select>
          <select value={filterCategory} onChange={e=>setFilterCategory(e.target.value)} style={{padding:'10px 14px', borderRadius:12, border:'1px solid rgba(255,255,255,0.15)', background: darkMode? 'rgba(255,255,255,0.08)':'rgba(255,255,255,0.6)'}}>
            <option value="">All Categories</option>
            {Array.from(new Set(transactions.map(t=>t.category))).map(c=> <option key={c} value={c}>{c}</option>)}
          </select>
          <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} style={{padding:'10px 14px', borderRadius:12, border:'1px solid rgba(255,255,255,0.15)', background: darkMode? 'rgba(255,255,255,0.08)':'rgba(255,255,255,0.6)'}} />
          <input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} style={{padding:'10px 14px', borderRadius:12, border:'1px solid rgba(255,255,255,0.15)', background: darkMode? 'rgba(255,255,255,0.08)':'rgba(255,255,255,0.6)'}} />
          <Button variant="contained" onClick={fetchTransactions} sx={{ background: darkMode? 'linear-gradient(45deg,#a855f7,#3b82f6)':'linear-gradient(45deg,#6366f1,#8b5cf6)', borderRadius:3, fontWeight:'bold' }}>Apply</Button>
          <Button variant="outlined" onClick={()=>{setKeyword('');setFilterType('');setFilterCategory('');setStartDate('');setEndDate('');fetchTransactions();}} sx={{borderRadius:3, fontWeight:'bold', color: darkMode? '#fff':'#1e293b'}}>Reset</Button>
          <Button variant="contained" startIcon={<Add />} onClick={()=>setFormOpen(true)} sx={{ background: darkMode? 'linear-gradient(45deg,#a855f7,#3b82f6)':'linear-gradient(45deg,#6366f1,#8b5cf6)', boxShadow: darkMode? '0 8px 32px rgba(168,85,247,.4)':'0 8px 32px rgba(99,102,241,.4)', borderRadius:3, px:3, fontWeight:'bold' }}>Add</Button>
          <ButtonGroup size="small" variant="outlined" sx={{ ml:{xs:0, md:1} }}>
            <Button onClick={()=>{ const qs = new URLSearchParams({ ...(filterType && {type:filterType}), ...(filterCategory && {category:filterCategory}), ...(startDate && {startDate}), ...(endDate && {endDate}) }); window.open(`/api/transactions/export?${qs.toString()}&format=csv`, '_blank'); }}>CSV</Button>
            <Button onClick={()=>{ const qs = new URLSearchParams({ ...(filterType && {type:filterType}), ...(filterCategory && {category:filterCategory}), ...(startDate && {startDate}), ...(endDate && {endDate}), format:'json' }); window.open(`/api/transactions/export?${qs.toString()}`, '_blank'); }}>JSON</Button>
          </ButtonGroup>
        </Box>
      </Box>
      <TableContainer component={Paper} sx={{ background: darkMode? 'rgba(255,255,255,0.05)':'rgba(255,255,255,0.9)', backdropFilter:'blur(20px)', border: darkMode? '1px solid rgba(255,255,255,0.1)':'1px solid rgba(255,255,255,0.3)', borderRadius:3, boxShadow: darkMode? '0 8px 32px rgba(0,0,0,0.3)':'0 8px 32px rgba(0,0,0,0.1)' }}>
        <Table>
          <TableHead>
            <TableRow sx={{ background: darkMode? 'rgba(168,85,247,0.1)':'rgba(99,102,241,0.1)' }}>
              {['Date','Type','Category','Description','Amount','Actions'].map(h=> <TableCell key={h} align={h==='Amount'? 'right': (h==='Actions'?'center':'left')} sx={{ fontWeight:'bold', color: darkMode? 'rgba(255,255,255,0.9)':'inherit', borderBottom: darkMode? '1px solid rgba(255,255,255,0.1)':'inherit'}}>{h}</TableCell>)}
            </TableRow>
          </TableHead>
          <TableBody>
            {transactions.map(t => (
              <TableRow key={t._id}>
                <TableCell>{new Date(t.date).toLocaleDateString()}</TableCell>
                <TableCell><Chip label={t.type} color={t.type==='income'? 'success':'error'} size="small" /></TableCell>
                <TableCell>{t.category}</TableCell>
                <TableCell>{t.description}</TableCell>
                <TableCell align="right">₹{t.amount.toLocaleString()}</TableCell>
                <TableCell align="center">
                  <IconButton size="small" onClick={()=>handleEdit(t)}><Edit /></IconButton>
                  <IconButton size="small" onClick={()=>handleDelete(t._id)}><Delete /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TransactionForm open={formOpen} onClose={handleFormClose} onSuccess={fetchTransactions} transaction={editingTransaction} />
    </Box>
  );
};

export default TransactionList;
