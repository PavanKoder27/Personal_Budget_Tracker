import React, { useState } from 'react';
import { Box, Container, Typography, Tabs, Tab, Grid, Card, CardHeader, CardContent, Chip, Tooltip, IconButton, Divider, useTheme, Stack, ToggleButtonGroup, ToggleButton, Switch, FormControlLabel } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import ArchitectureIcon from '@mui/icons-material/AccountTree';
import DataObjectIcon from '@mui/icons-material/DataObject';
import RouteIcon from '@mui/icons-material/Route';
import BuildIcon from '@mui/icons-material/Build';
import SchemaIcon from '@mui/icons-material/Schema';
import IntegrationInstructionsIcon from '@mui/icons-material/IntegrationInstructions';

interface SectionCardProps {
  title: string;
  items: { name: string; details: string[]; category?: string }[];
  color: string;
  gradient: string;
}

const SectionCard: React.FC<SectionCardProps> = ({ title, items, color, gradient }) => {
  const theme = useTheme();
  const dark = theme.palette.mode === 'dark';
  const glassLight = 'linear-gradient(135deg,rgba(255,255,255,0.92),rgba(255,255,255,0.7))';
  const glassDark = 'linear-gradient(135deg,rgba(30,41,59,0.75),rgba(51,65,85,0.55))';
  return (
    <Card
      elevation={6}
      sx={{
        height: '100%',
        position: 'relative',
        borderRadius: 4,
        background: `${gradient}`,
        '&::after': {
          content: '""',
          position: 'absolute',
          inset: 0,
          background: dark ? glassDark : glassLight,
          mixBlendMode: dark ? 'color-dodge' : 'normal',
          borderRadius: 4,
          pointerEvents: 'none'
        },
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        '&:before': {
          content: '""',
            position: 'absolute',
            inset: 0,
            background: dark
              ? 'radial-gradient(circle at 15% 15%, rgba(255,255,255,0.18), transparent 60%)'
              : 'radial-gradient(circle at 15% 15%, rgba(255,255,255,0.7), transparent 60%)',
            mixBlendMode: dark ? 'overlay' : 'soft-light'
        }
      }}
    >
      <CardHeader
        title={
          <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: 0.5 }}>
            {title}
          </Typography>
        }
        sx={{
          pb: 0,
          '& .MuiCardHeader-title': {
            background: dark
              ? 'linear-gradient(90deg,#ffffff,#e2e8f0)'
              : 'linear-gradient(90deg,#0f172a,#334155)',
            WebkitBackgroundClip: 'text',
            color: 'transparent'
          }
        }}
      />
      <CardContent sx={{ flex: 1, position: 'relative', zIndex: 2, pt: 1.5 }}>
        <Stack spacing={2}>
          {items.map(it => (
            <Box key={it.name} sx={{
              background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.85)',
              border: dark ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(30,41,59,0.12)',
              borderRadius: 3,
              p: 1.2,
              backdropFilter: 'blur(6px)',
              transition: 'all .4s',
              position: 'relative',
              '&:before': {
                content: '""',
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(120deg,rgba(255,255,255,0.25),transparent)',
                opacity: 0,
                transition: 'opacity .5s'
              },
              '&:hover': {
                boxShadow: dark
                  ? '0 6px 18px -4px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.15)'
                  : '0 6px 18px -6px rgba(30,41,59,0.25), 0 0 0 1px rgba(30,41,59,0.08)',
                transform: 'translateY(-4px) scale(1.015)',
                '&:before': { opacity: 1 }
              }
            }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: dark ? '#f1f5f9' : '#0f172a', mb: .5 }}>{it.name}</Typography>
              <Stack component="ul" sx={{ listStyle: 'none', p: 0, m: 0 }} spacing={0.5}>
                {it.details.map((d, idx) => (
                  <Typography key={idx} variant="caption" sx={{ color: dark ? 'rgba(255,255,255,0.75)' : 'rgba(30,41,59,0.75)' }}>• {d}</Typography>
                ))}
              </Stack>
            </Box>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
};

const UMLDiagram: React.FC = () => {
  const [tab, setTab] = useState(0);
  const [view, setView] = useState<'logical' | 'data' | 'flow'>('logical');
  const [dense, setDense] = useState(false);
  const theme = useTheme();
  const dark = theme.palette.mode === 'dark';

  const handleTab = (_: any, v: number) => setTab(v);

  // Data model extraction (simplified) - could be dynamic if models exported metadata
  const models = [
    { name: 'User', details: ['name: String', 'email: String', 'password: String'] },
    { name: 'Transaction', details: ['type: enum', 'amount: Number', 'category: String', 'date: Date', 'recurrence', 'anomaly?'] },
    { name: 'Budget', details: ['category: String', 'limit: Number', 'month: Date'] },
    { name: 'Goal', details: ['name: String', 'targetAmount: Number', 'currentAmount: Number', 'deadline: Date'] },
    { name: 'Group', details: ['name: String', 'members: [User]', 'expenses: []'] },
    { name: 'Stats', details: ['userId', 'category', 'type', 'mean', 'M2', 'count'] }
  ];

  const controllers = [
    { name: 'Auth', details: ['register()', 'login()', 'me()'] },
    { name: 'Transactions', details: ['list()', 'create()', 'update()', 'delete()', 'anomalies()'] },
    { name: 'Budgets', details: ['list()', 'create()', 'update()', 'delete()'] },
    { name: 'Goals', details: ['list()', 'create()', 'update()', 'delete()'] },
    { name: 'Groups', details: ['list()', 'create()', 'addExpense()', 'settlementSuggest()'] },
    { name: 'Insights', details: ['health()', 'summary()', 'checklist()'] }
  ];

  const routes = [
    { name: '/auth', details: ['POST /register', 'POST /login', 'GET /me'] },
    { name: '/transactions', details: ['GET /', 'POST /', 'PATCH /:id', 'DELETE /:id', 'GET /anomalies'] },
    { name: '/budgets', details: ['GET /', 'POST /', 'PATCH /:id', 'DELETE /:id'] },
    { name: '/goals', details: ['GET /', 'POST /', 'PATCH /:id', 'DELETE /:id'] },
    { name: '/groups', details: ['GET /', 'POST /', 'POST /:id/expenses'] },
    { name: '/insights', details: ['GET /health', 'GET /summary', 'GET /checklist'] }
  ];

  const middleware = [
    { name: 'authMiddleware', details: ['validates JWT', 'attaches req.user'] },
    { name: 'clerkOrJwt (removed)', details: ['historical - replaced by JWT only'] },
  ];

  const utilities = [
    { name: 'stats/anomaly', details: ['Welford update', 'z-score threshold', 'attach anomaly metadata'] },
    { name: 'recurrence engine', details: ['interval scan templates', 'materialize instances'] }
  ];

  const palette = {
    models: 'linear-gradient(135deg,#2563eb,#6366f1,#3b82f6)',
    controllers: 'linear-gradient(135deg,#dc2626,#f87171,#b91c1c)',
    routes: 'linear-gradient(135deg,#059669,#10b981,#047857)',
    middleware: 'linear-gradient(135deg,#d97706,#f59e0b,#b45309)'
  };

  const tabData = [
    { label: 'Overview', icon: <ArchitectureIcon /> },
    { label: 'Models', icon: <DataObjectIcon /> },
    { label: 'Controllers', icon: <IntegrationInstructionsIcon /> },
    { label: 'Routes', icon: <RouteIcon /> },
    { label: 'Middleware & Utils', icon: <BuildIcon /> }
  ];

  const renderOverview = () => (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h5" fontWeight={700} gutterBottom>System Views</Typography>
      <ToggleButtonGroup
        size="small"
        exclusive
        value={view}
        onChange={(_, v) => v && setView(v)}
        sx={{ mb: 3 }}
      >
        <ToggleButton value="logical">Logical</ToggleButton>
        <ToggleButton value="data">Data</ToggleButton>
        <ToggleButton value="flow">Request Flow</ToggleButton>
      </ToggleButtonGroup>
      {view === 'logical' && (
        <Typography variant="body2" sx={{ opacity: 0.85, mb: 2 }}>Logical layering separates UI, API routing, domain logic (in controllers), and persistence (Mongoose models). Utilities encapsulate cross-cutting analytics and scheduling.</Typography>
      )}
      {view === 'data' && (
        <Typography variant="body2" sx={{ opacity: 0.85, mb: 2 }}>Primary entities and supporting stats object enabling anomaly detection + recurrence templates embedded in transactions.</Typography>
      )}
      {view === 'flow' && (
        <Typography variant="body2" sx={{ opacity: 0.85, mb: 2 }}>Typical request: Component → Axios → Route → Auth Middleware → Controller → Model → (Stats update / Recurrence) → Response.</Typography>
      )}
      <Divider sx={{ my: 3 }} />
      <Grid container spacing={dense ? 1.5 : 3}>
        <Grid item xs={12} md={6} lg={3}><SectionCard title="Models" items={models} color={''} gradient={palette.models} /></Grid>
        <Grid item xs={12} md={6} lg={3}><SectionCard title="Controllers" items={controllers} color={''} gradient={palette.controllers} /></Grid>
        <Grid item xs={12} md={6} lg={3}><SectionCard title="Routes" items={routes} color={''} gradient={palette.routes} /></Grid>
        <Grid item xs={12} md={6} lg={3}><SectionCard title="Middleware & Utils" items={[...middleware, ...utilities]} color={''} gradient={palette.middleware} /></Grid>
      </Grid>
    </Box>
  );

  const renderGrid = (items: any[], title: string, gradient: string) => (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h5" fontWeight={700} gutterBottom>{title}</Typography>
      <Grid container spacing={dense ? 1.5 : 3}>
        {items.map(i => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={i.name}>
            <SectionCard title={i.name} items={[i]} color={''} gradient={gradient} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  return (
    <Box sx={{
      minHeight: '100vh',
      background: dark
        ? 'linear-gradient(135deg,#0f172a 0%,#1e293b 45%,#334155 100%)'
        : 'linear-gradient(135deg,#ffffff 0%,#f1f5f9 40%,#e0f2fe 100%)',
      py: 6,
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Animated decorative orbs */}
      <Box sx={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {[...Array(6)].map((_,i) => (
          <Box key={i} sx={{
            position: 'absolute',
            width: 240 - i*20,
            height: 240 - i*25,
            borderRadius: '50%',
            top: `${10 + i*8}%`,
            left: `${(i*17)%80}%`,
            background: `radial-gradient(circle at 30% 30%, ${dark ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.25)'}, transparent 70%)`,
            filter: 'blur(10px)',
            animation: 'float 14s ease-in-out infinite',
            animationDelay: `${i * 1.5}s`
          }} />
        ))}
        <style>{`@keyframes float {0%{transform:translateY(0) scale(1);}50%{transform:translateY(-35px) scale(1.05);}100%{transform:translateY(0) scale(1);} }`}</style>
      </Box>
      <Container maxWidth="xl">
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h3" fontWeight={800} sx={{
            background: dark
              ? 'linear-gradient(90deg,#6366f1,#a855f7,#6366f1)'
              : 'linear-gradient(90deg,#1e3a8a,#6366f1,#1e3a8a)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent'
          }}>Budget App Architecture</Typography>
          <Typography variant="subtitle1" sx={{ opacity: 0.75, maxWidth: 720, mx: 'auto' }}>Interactive UML-style overview. Switch views, explore components, and understand how layers collaborate—from API routes to anomaly detection utilities.</Typography>
          <FormControlLabel
            sx={{ mt: 2 }}
            control={<Switch checked={dense} onChange={e => setDense(e.target.checked)} />}
            label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Compact layout</Typography>}
          />
        </Box>

        {/* Color Legend */}
        <Box sx={{
          display: 'flex',
            flexWrap: 'wrap',
            gap: 1.5,
            mb: 3,
            p: 1.5,
            borderRadius: 3,
            background: dark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.7)',
            backdropFilter: 'blur(12px)',
            boxShadow: dark ? '0 4px 14px -4px rgba(0,0,0,0.6)' : '0 6px 18px -8px rgba(30,41,59,0.25)'
        }}>
          {[
            { label: 'Models', g: palette.models },
            { label: 'Controllers', g: palette.controllers },
            { label: 'Routes', g: palette.routes },
            { label: 'Middleware & Utils', g: palette.middleware }
          ].map(item => (
            <Box key={item.label} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 26, height: 26, borderRadius: '50%', background: item.g, boxShadow: '0 0 0 2px rgba(255,255,255,0.4)', border: dark ? '1px solid rgba(255,255,255,0.3)' : '1px solid rgba(30,41,59,0.25)' }} />
              <Typography variant="caption" sx={{ fontWeight: 600, letterSpacing: 0.5 }}>{item.label}</Typography>
            </Box>
          ))}
        </Box>

        <Tabs
          value={tab}
          onChange={handleTab}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            borderRadius: 3,
            mb: 2,
            background: dark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.6)',
            backdropFilter: 'blur(10px)',
            '& .MuiTab-root': { fontWeight: 600, letterSpacing: 0.4 },
            '& .MuiTabs-indicator': { height: 4, borderRadius: 2 }
          }}
        >
          {tabData.map(t => <Tab key={t.label} icon={t.icon} label={t.label} iconPosition="start" />)}
        </Tabs>

        {tab === 0 && renderOverview()}
        {tab === 1 && renderGrid(models, 'Domain Models', palette.models)}
        {tab === 2 && renderGrid(controllers, 'Controllers', palette.controllers)}
        {tab === 3 && renderGrid(routes, 'REST Routes', palette.routes)}
        {tab === 4 && (
          <Box>
            {renderGrid([...middleware, ...utilities], 'Middleware & Utilities', palette.middleware)}
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default UMLDiagram;
