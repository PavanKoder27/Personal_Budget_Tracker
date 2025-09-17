import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Grid, Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton, List, ListItem, ListItemText, Divider, Chip, Button, MenuItem, Select, FormControl, InputLabel, Alert, ToggleButtonGroup, ToggleButton, Tooltip, CircularProgress, Slide, Fade, Avatar, Menu, MenuItem as MuiMenuItem, Tabs, Tab } from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import PageHeading from './shared/PageHeading';
import AnimatedButton from './shared/AnimatedButton';
import api from '../services/api';
import { Group, GroupExpense, GroupBalances, GroupMember } from '../types';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import CurrencyExchangeIcon from '@mui/icons-material/CurrencyExchange';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';

const Groups: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [open, setOpen] = useState(false);
  const [openExpense, setOpenExpense] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [balances, setBalances] = useState<GroupBalances>({});
  const [form, setForm] = useState({ name: '', description: '' });
  const [expenseForm, setExpenseForm] = useState<{ amount: number; description: string; category: string; splits: { user: string; amount: number; }[] }>({ amount: 0, description: '', category: 'General', splits: [] });
  const [newMember, setNewMember] = useState({ name: '' });
  const [percentMode, setPercentMode] = useState(false);
  const [expenseHistory, setExpenseHistory] = useState<any[]>([]);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const { show } = useNotification();
  const [addingMember, setAddingMember] = useState(false);
  const [deletingGroup, setDeletingGroup] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const categories = ['Food','Travel','Stay','Tickets','Shopping','Entertainment','Utilities','Misc','General'];
  const [memberAnchor, setMemberAnchor] = useState<HTMLElement | null>(null);
  const [activeMember, setActiveMember] = useState<GroupMember | null>(null);
  const [inviteMode, setInviteMode] = useState<'name' | 'email'>('name');
  const [inviteEmail, setInviteEmail] = useState('');
  const [settleOpen, setSettleOpen] = useState(false);
  const [editingMeta, setEditingMeta] = useState(false);
  const [metaDraft, setMetaDraft] = useState({ name: '', description: '' });
  const [savingMeta, setSavingMeta] = useState(false);
  const [settleForm, setSettleForm] = useState<{ paidTo: string; amount: number }>({ paidTo: '', amount: 0 });

  const fetchGroups = async () => {
    try { const res = await api.get<Group[]>('/groups'); setGroups(res.data);} catch(e){console.error(e);} }

  const fetchBalances = async (groupId: string) => {
    try { const res = await api.get<GroupBalances>(`/groups/${groupId}/balances`); setBalances(res.data);} catch(e){console.error(e);} }

  useEffect(()=>{ fetchGroups(); }, []);

  // Prefer backend-provided stable userId (original ObjectId) to support placeholders, then fall back to populated user._id
  const memberId = (m:any) => (m.userId || (typeof m.user === 'string' ? m.user : (m.user && (m.user as any)._id) || m.user)) as string;
  const openGroup = async (g: Group) => { 
    setSelectedGroup(g); 
    fetchBalances(g._id); 
    try { 
      const res = await api.get(`/groups/${g._id}/expenses`); 
      setExpenseHistory(res.data as any[]); 
    } catch(e){ console.error(e); } 
  };

  const createGroup = async () => { if(!form.name) return; await api.post('/groups', form); setOpen(false); setForm({name:'', description:''}); fetchGroups(); };

  const validateAndAdjustSplits = () => {
    const total = expenseForm.amount;
    if(total<=0) { setError('Enter total'); return false; }
    const sum = expenseForm.splits.reduce((s,c)=> s + (c.amount||0), 0);
    if(percentMode){
      if(sum !== 100){ setError('Percent splits must total 100'); return false; }
      setError(''); return true;
    }
    const diff = Number((total - sum).toFixed(2));
    if(Math.abs(diff) <= 0.02){
      // auto-adjust last
      setExpenseForm(f=> ({ ...f, splits: f.splits.map((s,i)=> i===f.splits.length-1 ? { ...s, amount: Number((s.amount + diff).toFixed(2)) } : s ) }));
      setError('');
      return true;
    }
    if(diff !==0){ setError(`Split mismatch by ${diff}`); return false; }
    setError('');
    return true;
  };

  const addExpense = async () => {
    if(!selectedGroup || !expenseForm.amount || !expenseForm.description) { show('Fill in amount and description','warning'); return; }
    if(!validateAndAdjustSplits()) return;
    try {
      const payload: any = { amount: expenseForm.amount, description: expenseForm.description, category: expenseForm.category, splits: percentMode ? expenseForm.splits.map(s=> ({ user: s.user, amount: Number(((s.amount||0)/100*expenseForm.amount).toFixed(2)) })) : expenseForm.splits };
      await api.post(`/groups/${selectedGroup._id}/expenses`, payload);
      setOpenExpense(false);
      setExpenseForm({ amount:0, description:'', category:'General', splits:[]});
      setPercentMode(false);
      fetchBalances(selectedGroup._id);
      openGroup(selectedGroup);
      show('Expense added','success');
    } catch(e:any){
      const msg = e?.response?.data?.message || 'Failed to add expense';
      show(msg, 'error');
    }
  };

  const isAdmin = (g?: Group | null) => {
    if(!g || !user) return false;
    return g.members.some(m => m.isAdmin && memberId(m) === user.id);
  };

  const addMember = async () => {
    if(!selectedGroup || !newMember.name.trim()) { show('Enter a member name','warning'); return; }
    if(!isAdmin(selectedGroup)) { show('Only group admin can add members','error'); return; }
    setAddingMember(true);
    try { 
      await api.post(`/groups/${selectedGroup._id}/members`, { name: newMember.name.trim() });
      show('Member added','success');
      setNewMember({ name:'' });
      // Refresh the selected group in-place without closing dialog
  const refreshed = await api.get<Group>(`/groups/${selectedGroup._id}`);
  setSelectedGroup(refreshed.data);
  fetchGroups();
  // Refresh balances so new placeholder member does not show raw id in list
  fetchBalances(selectedGroup._id);
    } catch(e:any){
      let msg = e?.response?.data?.message || 'Failed to add member';
      if(/already exists/i.test(msg)) {
        msg = 'A member with that name already exists in this group';
      }
      show(msg, 'error');
    } finally { setAddingMember(false); }
  };

  const inviteByEmail = async () => {
    if(!selectedGroup || !inviteEmail.trim()) { show('Enter an email','warning'); return; }
    if(!isAdmin(selectedGroup)) { show('Only admin can invite','error'); return; }
    setAddingMember(true);
    try {
      // Reuse member add route with placeholder name if email user not found: backend currently lacks direct email invite
      // For minimal change: call /auth/me like check? Instead, attempt to add using local part of email as name.
      const namePart = inviteEmail.split('@')[0];
      await api.post(`/groups/${selectedGroup._id}/members`, { name: namePart });
      show('Invited (placeholder member added)','success');
      setInviteEmail('');
  const refreshed = await api.get<Group>(`/groups/${selectedGroup._id}`);
  setSelectedGroup(refreshed.data);
  fetchGroups();
  fetchBalances(selectedGroup._id);
    } catch(e:any){ 
      let msg = e?.response?.data?.message || 'Invite failed';
      if(/already exists/i.test(msg)) msg = 'A member with that name already exists in this group';
      show(msg,'error'); 
    } finally { setAddingMember(false); }
  };

  const openMemberMenu = (m: GroupMember, el: HTMLElement) => { setActiveMember(m); setMemberAnchor(el); };
  const closeMemberMenu = () => { setMemberAnchor(null); setActiveMember(null); };

  const toggleAdmin = async () => {
    if(!selectedGroup || !activeMember) return;
    try {
      const targetId = (activeMember as any)._id; if(!targetId){ show('Missing member id','error'); return; }
  const res = await api.patch<Group>(`/groups/${selectedGroup._id}/members/${targetId}/role`, { isAdmin: !activeMember.isAdmin });
  setSelectedGroup(res.data as Group);
      fetchGroups();
      show(activeMember.isAdmin ? 'Demoted from admin' : 'Promoted to admin','success');
    } catch(e:any){ show(e?.response?.data?.message || 'Role change failed','error'); }
    closeMemberMenu();
  };

  const removeMember = async () => {
    if(!selectedGroup || !activeMember) return;
    if(!window.confirm(`Remove ${activeMember.name}?`)) return;
    try {
      const targetId = (activeMember as any)._id; if(!targetId){ show('Missing member id','error'); return; }
  const res = await api.delete<Group>(`/groups/${selectedGroup._id}/members/${targetId}`);
  setSelectedGroup(res.data as Group);
      fetchGroups();
      show('Member removed','info');
    } catch(e:any){ show(e?.response?.data?.message || 'Remove failed','error'); }
    closeMemberMenu();
  };

  const startEditMeta = () => { if(!selectedGroup) return; setEditingMeta(true); setMetaDraft({ name: selectedGroup.name, description: selectedGroup.description || '' }); };
  const cancelEditMeta = () => { setEditingMeta(false); };
  const saveMeta = async () => {
    if(!selectedGroup) return; if(!metaDraft.name.trim()) { show('Name required','warning'); return; }
    setSavingMeta(true);
  try { const res = await api.patch<Group>(`/groups/${selectedGroup._id}`, { name: metaDraft.name.trim(), description: metaDraft.description }); setSelectedGroup(res.data as Group); fetchGroups(); show('Group updated','success'); setEditingMeta(false);} catch(e:any){ show(e?.response?.data?.message || 'Update failed','error'); } finally { setSavingMeta(false); }
  };

  const openSettle = () => { if(!selectedGroup) return; // choose first other member as default
    const others = selectedGroup.members.filter(m=> memberId(m) !== user?.id);
    setSettleForm({ paidTo: others[0]?.user || '', amount: 0 });
    setSettleOpen(true);
  };
  const submitSettlement = async () => {
    if(!selectedGroup) return; if(!settleForm.paidTo || settleForm.amount <=0){ show('Enter amount and recipient','warning'); return; }
    try { await api.post(`/groups/${selectedGroup._id}/settlements`, { paidTo: settleForm.paidTo, amount: settleForm.amount }); show('Settlement recorded','success'); fetchBalances(selectedGroup._id); openGroup(selectedGroup); setSettleOpen(false);} catch(e:any){ show(e?.response?.data?.message || 'Settlement failed','error'); }
  };

  const autoSplitEqual = () => {
    if(!selectedGroup || expenseForm.amount <=0) return;
  const per = Number((expenseForm.amount / selectedGroup.members.length).toFixed(2));
  setExpenseForm(f=> ({ ...f, splits: selectedGroup.members.map(m=> ({ user: memberId(m), amount: per })) }));
  };

  const togglePercentMode = () => {
    if(!selectedGroup) return;
    if(!percentMode){
      // convert current amounts to % if total exists
      const total = expenseForm.amount;
      if(total>0){
        setExpenseForm(f=> ({ ...f, splits: f.splits.map(s=> ({ ...s, amount: total? Number((((s.amount||0)/total)*100).toFixed(2)) : 0 })) }));
      }
    } else {
      // convert % back to amounts
      const total = expenseForm.amount;
      setExpenseForm(f=> ({ ...f, splits: f.splits.map(s=> ({ ...s, amount: Number(((s.amount||0)/100*total).toFixed(2)) })) }));
    }
    setPercentMode(p=>!p);
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <PageHeading emoji="👥" title="Groups" />
        <AnimatedButton startIcon={<AddIcon/>} onClick={()=>setOpen(true)}>Create Group</AnimatedButton>
      </Box>

      <Grid container spacing={3}>
        {groups.map(g=> (
          <Grid item xs={12} md={6} lg={4} key={g._id}>
            <Paper onClick={()=>openGroup(g)} sx={{ p:3, borderRadius:4, cursor:'pointer', position:'relative', overflow:'hidden', transition:'all .35s', '&:hover':{ transform:'translateY(-4px)', boxShadow:'0 12px 30px -6px rgba(0,0,0,0.25)' } }}>
              <Typography variant="h6" fontWeight={600}>{g.name}</Typography>
              <Typography variant="body2" color="text.secondary" mb={1}>{g.description || 'No description'}</Typography>
              <Box display="flex" gap={1} flexWrap="wrap">
                {g.members.map(m=> <Chip key={memberId(m)} label={m.name} size="small" color={m.isAdmin? 'secondary':'default'} />)}
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Group detail drawer style dialog */}
      <Dialog open={Boolean(selectedGroup)} onClose={()=>setSelectedGroup(null)} fullWidth maxWidth="md">
        <DialogTitle sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:1 }}>
          {editingMeta ? (
            <Box sx={{ flexGrow:1, display:'flex', flexDirection:'column', gap:1 }}>
              <TextField size="small" label="Name" value={metaDraft.name} onChange={e=>setMetaDraft(d=>({...d,name:e.target.value}))} />
              <TextField size="small" label="Description" value={metaDraft.description} onChange={e=>setMetaDraft(d=>({...d,description:e.target.value}))} />
            </Box>
          ) : (
            <Box sx={{ flexGrow:1 }}>
              <Typography variant="h6" fontWeight={600}>{selectedGroup?.name}</Typography>
              {selectedGroup?.description && <Typography variant="caption" color="text.secondary">{selectedGroup.description}</Typography>}
            </Box>
          )}
          {isAdmin(selectedGroup) && !editingMeta && <Tooltip title="Edit group"><IconButton onClick={startEditMeta}><EditIcon fontSize="small"/></IconButton></Tooltip>}
          {editingMeta && (
            <Box sx={{ display:'flex', gap:1 }}>
              <Tooltip title="Cancel"><span><IconButton disabled={savingMeta} onClick={cancelEditMeta}><CloseRoundedIcon fontSize="small"/></IconButton></span></Tooltip>
              <Tooltip title="Save changes"><span><IconButton disabled={savingMeta} onClick={saveMeta}>{savingMeta? <CircularProgress size={18}/> : <SaveIcon fontSize="small"/>}</IconButton></span></Tooltip>
            </Box>
          )}
          <IconButton onClick={()=>setSelectedGroup(null)}><CloseIcon/></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="subtitle2" sx={{ mt:1, mb:1 }}>Members</Typography>
          <Box display="flex" gap={1} flexWrap="wrap" mb={2}>{selectedGroup?.members.map(m=> {
            const initials = m.name.split(/\s+/).map(p=>p[0]).slice(0,2).join('').toUpperCase();
            const populated = (m as any).user && typeof (m as any).user === 'object';
            const profilePic = populated && (m as any).user.profilePicture;
            const chip = (
              <Chip
                key={memberId(m)}
                avatar={profilePic ? <Avatar src={profilePic} /> : <Avatar sx={{ bgcolor: m.isAdmin? 'secondary.main':'primary.dark', fontSize:12 }}>{initials}</Avatar>}
                label={m.name + (m.isAdmin? ' (Admin)':'')}
                size="small"
                onClick={isAdmin(selectedGroup)? (e)=> openMemberMenu(m, e.currentTarget) : undefined}
                variant={activeMember && activeMember.user === m.user ? 'outlined':'filled'}
                color={profilePic ? 'success' : undefined}
              />
            );
            return profilePic ? (
              <Tooltip key={memberId(m)} title={`Existing user: ${ (m as any).user.email || ''}`}>{chip}</Tooltip>
            ) : chip;
          })}</Box>
          {!isAdmin(selectedGroup) && user && (
            <Typography variant="caption" color="text.secondary" sx={{ display:'block', mb:2 }}>
              You are not an admin of this group. Only admins can add members or delete the group.
            </Typography>
          )}
          <Divider sx={{ my:2 }}/>
          <Typography variant="subtitle2" sx={{ mb:1 }}>Balances</Typography>
          <List dense>
            {Object.entries(balances).map(([uid, val])=>{
              const member = selectedGroup?.members.find(m=> memberId(m) === uid);
              const displayName = member?.name || '(Unknown Member)';
              const secondary = val===0 ? 'Settled' : (val>0? `Gets ₹${val}` : `Owes ₹${Math.abs(val)}`);
              return <ListItem key={uid} sx={{ bgcolor:'background.paper', borderRadius:2, mb:1 }}>
                <ListItemText
                  primary={
                    <Box component="span" sx={{ fontStyle: member?.isPlaceholder ? 'italic' : 'normal', opacity: member?.isPlaceholder ? 0.9 : 1 }}>
                      {displayName}{member?.isPlaceholder && ' (placeholder)'}
                    </Box>
                  }
                  secondary={secondary}
                />
              </ListItem>;
            })}
          </List>
          <Divider sx={{ my:2 }} />
          <Typography variant="subtitle2" sx={{ mb:1 }}>Recent Expenses</Typography>
          <List dense sx={{ maxHeight:200, overflow:'auto' }}>
            {expenseHistory.map(ex=> (
              <ListItem key={ex._id} sx={{ bgcolor:'background.paper', borderRadius:2, mb:1 }}>
                <ListItemText primary={`${ex.description} · ₹${ex.amount}`} secondary={`${ex.category || 'General'} • ${new Date(ex.date).toLocaleDateString()}`} />
              </ListItem>
            ))}
            {!expenseHistory.length && <Typography variant="caption" color="text.secondary">No expenses yet.</Typography>}
          </List>
          {/* Add member inline */}
          {isAdmin(selectedGroup) && (
            <Box sx={{ mt:2 }}>
              <Tabs value={inviteMode} onChange={(_,v)=>setInviteMode(v)} sx={{ minHeight:32,'& .MuiTab-root':{ minHeight:32, py:0.5 }}}>
                <Tab value="name" label="Add by Name" />
                <Tab value="email" label="Invite by Email" />
              </Tabs>
              {inviteMode === 'name' ? (
                <Box sx={{ mt:1, display:'flex', gap:1, flexWrap:'wrap', alignItems:'center' }}>
                  <TextField size="small" label="Member Name" value={newMember.name} onChange={e=>setNewMember({ name:e.target.value })} disabled={addingMember} />
                  <Tooltip title="Add a new placeholder member">
                    <span>
                      <Button variant="outlined" size="small" onClick={addMember} disabled={addingMember} startIcon={addingMember? <CircularProgress size={16}/> : undefined}>Add</Button>
                    </span>
                  </Tooltip>
                </Box>
              ) : (
                <Box sx={{ mt:1, display:'flex', gap:1, flexWrap:'wrap', alignItems:'center' }}>
                  <TextField size="small" type="email" label="User Email" value={inviteEmail} onChange={e=>setInviteEmail(e.target.value)} disabled={addingMember} />
                  <Tooltip title="Invite existing user (placeholder if not found)">
                    <span>
                      <Button variant="outlined" size="small" onClick={inviteByEmail} disabled={addingMember} startIcon={addingMember? <CircularProgress size={16}/> : undefined}>Invite</Button>
                    </span>
                  </Tooltip>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px:3, py:2, justifyContent:'space-between' }}>
          {isAdmin(selectedGroup) && (
            <Button color="error" disabled={deletingGroup} onClick={()=> setConfirmDeleteOpen(true)}>{deletingGroup? 'Deleting...' : 'Delete Group'}</Button>
          )}
          <AnimatedButton onClick={()=>{ setOpenExpense(true); setExpenseForm({ amount:0, description:'', category:'General', splits: selectedGroup? selectedGroup.members.map(m=>({user: memberId(m), amount:0})) : []}); }}>Add Expense</AnimatedButton>
          {isAdmin(selectedGroup) && <AnimatedButton color="secondary" onClick={openSettle} startIcon={<CurrencyExchangeIcon/>}>Settle Up</AnimatedButton>}
          <AnimatedButton color="inherit" onClick={()=>setSelectedGroup(null)}>Close</AnimatedButton>
        </DialogActions>
      </Dialog>

      <Menu anchorEl={memberAnchor} open={Boolean(memberAnchor)} onClose={closeMemberMenu} elevation={3}>
        <MuiMenuItem disabled>{activeMember?.name}</MuiMenuItem>
        {activeMember && <MuiMenuItem onClick={toggleAdmin}>{activeMember.isAdmin? 'Remove Admin':'Make Admin'}</MuiMenuItem>}
        {activeMember && <MuiMenuItem onClick={removeMember} disabled={activeMember.isAdmin && selectedGroup?.members.filter(m=>m.isAdmin).length===1}>Remove Member</MuiMenuItem>}
      </Menu>

      {/* Fancy Delete Confirmation Dialog */}
  <Dialog open={confirmDeleteOpen} onClose={()=>!deletingGroup && setConfirmDeleteOpen(false)} maxWidth="xs" fullWidth TransitionComponent={Slide}>
        <DialogTitle sx={{ display:'flex', alignItems:'center', gap:1 }}>
          <WarningAmberIcon color="warning" /> Confirm Deletion
        </DialogTitle>
        <DialogContent dividers>
          <Fade in timeout={500}>
            <Box>
              <Typography variant="body2" sx={{ mb:2 }}>
                This will permanently remove the group{selectedGroup ? ` "${selectedGroup.name}"` : ''}, its members list, and all related expenses & settlements.
              </Typography>
              <Alert severity="error" variant="outlined" sx={{ fontSize:'.85rem', borderRadius:2 }}>
                This action cannot be undone.
              </Alert>
            </Box>
          </Fade>
        </DialogContent>
        <DialogActions sx={{ px:3, py:2, gap:1 }}>
          <Button disabled={deletingGroup} onClick={()=> setConfirmDeleteOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" disabled={deletingGroup} onClick={async ()=>{
            if(!selectedGroup) return; 
            setDeletingGroup(true);
            const id = selectedGroup._id;
            try {
              await api.delete(`/groups/${id}`);
              show('Group deleted','success');
              setConfirmDeleteOpen(false);
              setSelectedGroup(null);
              setGroups(gs => gs.filter(g=> g._id !== id));
            } catch(e:any){
              show(e?.response?.data?.message || 'Delete failed','error');
            } finally { setDeletingGroup(false); fetchGroups(); }
          }}>{deletingGroup? <CircularProgress size={18} /> : 'Delete Permanently'}</Button>
        </DialogActions>
      </Dialog>

      {/* Add expense dialog */}
      <Dialog open={openExpense} onClose={()=>setOpenExpense(false)} fullWidth maxWidth="sm">
        <DialogTitle>Add Group Expense</DialogTitle>
        <DialogContent dividers>
          <TextField label="Description" fullWidth margin="normal" value={expenseForm.description} onChange={e=>setExpenseForm(f=>({...f, description:e.target.value}))} />
          <TextField type="number" label="Total Amount" fullWidth margin="normal" value={expenseForm.amount} onChange={e=>setExpenseForm(f=>({...f, amount:Number(e.target.value)}))} />
          <FormControl fullWidth margin="normal" size="small">
            <InputLabel>Category</InputLabel>
            <Select value={expenseForm.category} label="Category" onChange={e=>setExpenseForm(f=>({...f, category:String(e.target.value)}))}>
              {categories.map(c=> <MenuItem key={c} value={c}>{c}</MenuItem>)}
            </Select>
          </FormControl>
          <Box display="flex" gap={1} alignItems="center" mt={1} mb={1}>
            <Typography variant="subtitle2" flexGrow={1}>Split {percentMode? 'Percents (100 total)':'Amounts'}</Typography>
            <ToggleButtonGroup size="small" exclusive value={percentMode? 'percent':'amount'} onChange={togglePercentMode}>
              <ToggleButton value="amount">Amount</ToggleButton>
              <ToggleButton value="percent">%</ToggleButton>
            </ToggleButtonGroup>
            <Button size="small" variant="outlined" onClick={autoSplitEqual}>Equal</Button>
          </Box>
          <List dense>
            {expenseForm.splits.map((s,idx)=>(
              <ListItem key={s.user} sx={{ gap:2 }}>
                <ListItemText primary={selectedGroup?.members.find(m=>memberId(m)===s.user)?.name || s.user} />
                <TextField type="number" size="small" value={s.amount} onChange={e=>{
                  const val = Number(e.target.value); setExpenseForm(f=>{ const splits=[...f.splits]; splits[idx]={...splits[idx], amount:val}; return {...f, splits}; }); }} InputProps={{ endAdornment: percentMode? <Typography variant="caption" sx={{ ml:0.5 }}>%</Typography>: undefined }} />
              </ListItem>
            ))}
          </List>
          {error && <Alert severity="warning" sx={{ mt:1 }}>{error}</Alert>}
        </DialogContent>
        <DialogActions>
          <AnimatedButton color="inherit" onClick={()=>setOpenExpense(false)}>Cancel</AnimatedButton>
          <AnimatedButton onClick={addExpense}>Save Expense</AnimatedButton>
        </DialogActions>
      </Dialog>

      {/* Settlement dialog */}
      <Dialog open={settleOpen} onClose={()=>setSettleOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Record Settlement</DialogTitle>
        <DialogContent dividers>
          <FormControl fullWidth size="small" margin="normal">
            <InputLabel>Paid To</InputLabel>
            <Select label="Paid To" value={settleForm.paidTo} onChange={e=>setSettleForm(f=>({...f, paidTo:String(e.target.value)}))}>
              {selectedGroup?.members.filter(m=> memberId(m) !== user?.id).map(m=> <MenuItem key={memberId(m)} value={memberId(m)}>{m.name}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField type="number" label="Amount" fullWidth size="small" margin="normal" value={settleForm.amount} onChange={e=>setSettleForm(f=>({...f, amount:Number(e.target.value)}))} />
          <Alert severity="info" sx={{ mt:1 }}>
            Positive balances mean the member should receive money. Use settlements to reduce outstanding balances.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>setSettleOpen(false)}>Cancel</Button>
            <AnimatedButton onClick={submitSettlement}>Save</AnimatedButton>
        </DialogActions>
      </Dialog>

      <Dialog open={open} onClose={()=>setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Create Group</DialogTitle>
        <DialogContent dividers>
          <TextField label="Name" fullWidth margin="normal" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} />
          <TextField label="Description" fullWidth margin="normal" value={form.description} onChange={e=>setForm({...form, description:e.target.value})} />
        </DialogContent>
        <DialogActions>
          <AnimatedButton color="inherit" onClick={()=>setOpen(false)}>Cancel</AnimatedButton>
          <AnimatedButton onClick={createGroup}>Create</AnimatedButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Groups;
