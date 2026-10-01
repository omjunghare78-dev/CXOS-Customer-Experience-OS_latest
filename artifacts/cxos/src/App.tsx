import { type CSSProperties, type ReactNode, useEffect, useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { Link, Route, Switch, useLocation, useParams, Router as WouterRouter } from 'wouter';
import {
  Activity, AlertTriangle, ArrowDownRight, ArrowRight, ArrowUpRight, AudioLines, BadgeCheck,
  BarChart3, Bot, BriefcaseBusiness, Check, CheckCircle2, ChevronDown, ChevronRight,
  CircleHelp, Compass, FileText, Filter, HeartPulse, Inbox, Lightbulb, ListChecks,
  LoaderCircle, LockKeyhole, Menu, MessageSquare, Moon, RotateCcw, Search, Send, Settings2,
  ShieldCheck, Sparkles, Sun, TrendingDown, TrendingUp, Users, WandSparkles,
} from 'lucide-react';
import {
  useAskCxosCopilot, useDecideCxosAction, useExecuteCxosRescue, useGetCxosActions,
  useEscalateCxosCustomer, useGetCxosAudit, useGetCxosCustomer, useGetCxosCustomers, useGetCxosIntelligence,
  useGetCxosOverview, useHealthCheck, useResetCxosDemo, getGetCxosActionsQueryKey,
  getGetCxosAuditQueryKey, getGetCxosCustomerQueryKey, getGetCxosCustomersQueryKey,
  getGetCxosIntelligenceQueryKey, getGetCxosOverviewQueryKey, getHealthCheckQueryKey,
  useResolveCxosCustomer,
} from '@workspace/api-client-react';
import type { Customer, RecommendedAction } from '@workspace/api-client-react';

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } } });
const navGroups = [
    { label: 'Workspace', links: [
    { href: '/overview', title: 'Overview', icon: BarChart3 },
    { href: '/inbox', title: 'Inbox', icon: Inbox },
    { href: '/customers', title: 'Customers', icon: Users },
    { href: '/actions', title: 'Action review', icon: ListChecks },
  ] },
  { label: 'Intelligence', links: [
    { href: '/intelligence', title: 'CX intelligence', icon: Activity },
    { href: '/copilot', title: 'Copilot', icon: Sparkles },
  ] },
  { label: 'Governance', links: [{ href: '/trust', title: 'Trust & audit', icon: ShieldCheck }] },
];
const cx = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(' ');
const initials = (name: string) => name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();
const pct = (n?: number) => `${Math.round(n ?? 0)}%`;
const displayDate = (value?: string) => value ? new Date(value).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '—';
const firstName = (name?: string) => name?.split(' ')[0] ?? 'customer';

function AppFrame({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dark, setDark] = useState(() => localStorage.getItem('cxos-theme') === 'dark');
  const [resetOpen, setResetOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const health = useHealthCheck({ query: { queryKey: getHealthCheckQueryKey() } });
  const resetDemo = useResetCxosDemo();
  const client = useQueryClient();
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('cxos-theme', dark ? 'dark' : 'light');
  }, [dark]);
  useEffect(() => setMobileOpen(false), [location]);
  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(''), 3800);
    return () => window.clearTimeout(timeout);
  }, [notice]);
  const current = navGroups.flatMap((g) => g.links).find((link) => link.href === location)?.title ?? (location.startsWith('/customers/') ? 'Customer 360' : 'CXOS');
  const reset = () => resetDemo.mutate(undefined, { onSuccess: () => {
    [getGetCxosOverviewQueryKey(), getGetCxosCustomersQueryKey(), getGetCxosActionsQueryKey(), getGetCxosAuditQueryKey(), getGetCxosIntelligenceQueryKey()].forEach((queryKey) => client.invalidateQueries({ queryKey }));
    setResetOpen(false); setNotice('Demo workspace restored to its initial synthetic state.');
  }, onError: () => setNotice('Could not reset the demo. Try again.') });
  return <div className="app-shell">
    <aside className={cx('sidebar', mobileOpen && 'open')}>
      <Link href="/" className="brand"><span className="brand-mark"><Activity size={18} strokeWidth={2.6} /></span><span>CXOS<small>EXPERIENCE OPERATIONS</small></span></Link>
      <button className="workspace-select" type="button" onClick={() => setNotice('You are viewing the CXOS demo workspace.')} data-testid="button-workspace"><span><BriefcaseBusiness size={14} style={{ verticalAlign: 'middle', marginRight: 8 }} />Northstar Demo</span><ChevronDown size={13} /></button>
      {navGroups.map((group) => <div key={group.label}><div className="nav-label">{group.label}</div>{group.links.map(({ href, title, icon: Icon }) =>
        <Link key={href} href={href} className={cx('nav-link', location === href && 'active')} data-testid={`link-nav-${title.toLowerCase().replaceAll(' ', '-')}`}><Icon /><span>{title}</span>{title === 'Action review' && <span style={{ marginLeft: 'auto', fontSize: 9, color: '#92a6c6' }}>REVIEW</span>}</Link>)}</div>)}
      <div className="sidebar-foot">
        <Link href="/trust" className="nav-link"><CircleHelp /><span>Help & safety</span></Link>
        <div className="demo-note"><strong><span className="status-dot" style={{ display: 'inline-block', marginRight: 7 }} />Demo environment</strong>All data is synthetic. AI actions require human approval.</div>
      </div>
    </aside>
    <div className="main-area">
      <header className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}><button className="icon-button mobile-menu" aria-label="Open navigation" onClick={() => setMobileOpen(!mobileOpen)} data-testid="button-menu"><Menu size={16} /></button><div className="crumb">CXOS <ChevronRight size={12} style={{ display: 'inline', margin: '0 5px', verticalAlign: 'middle' }} /><strong>{current}</strong></div></div>
        <div className="top-actions"><div className="status-live"><span className="status-dot" />{health.isError ? 'API unavailable' : 'Demo AI'}<span style={{ color: 'hsl(var(--muted-foreground))' }}>·</span> Synthetic data</div><button className="icon-button" title="Toggle theme" onClick={() => setDark(!dark)} data-testid="button-theme">{dark ? <Sun size={15} /> : <Moon size={15} />}</button><button className="icon-button" title="Reset demo data" onClick={() => setResetOpen(true)} data-testid="button-reset"><RotateCcw size={14} /></button><div className="avatar" aria-label="Demo operator">OP</div></div>
      </header>
      <main>{children}</main>
    </div>
    {notice && <div role="status" style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 60, padding: '12px 16px', borderRadius: 9, background: 'hsl(var(--foreground))', color: 'hsl(var(--background))', boxShadow: '0 8px 26px #09162b33', fontSize: 11 }}>{notice}</div>}
    {resetOpen && <div className="overlay" role="dialog" aria-modal="true"><div className="modal"><h2>Reset the demo workspace?</h2><p>This restores the synthetic customer, conversation, and action data to its starting state. This cannot be undone.</p><div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}><button className="btn secondary" onClick={() => setResetOpen(false)} data-testid="button-cancel-reset">Cancel</button><button className="btn danger" disabled={resetDemo.isPending} onClick={reset} data-testid="button-confirm-reset">{resetDemo.isPending ? 'Resetting…' : 'Reset demo'}</button></div></div></div>}
  </div>;
}

function PageHead({ eyebrow, title, sub, children }: { eyebrow: string; title: string; sub?: string; children?: ReactNode }) {
  return <div className="page-head fade-in"><div><div className="eyebrow">{eyebrow}</div><h1 className="page-title">{title}</h1>{sub && <p className="page-sub">{sub}</p>}</div>{children && <div>{children}</div>}</div>;
}
function LoadingBlock() { return <div className="skeleton" aria-label="Loading data" data-testid="status-loading" />; }
function QueryError({ retry, label = 'Data could not load' }: { retry: () => void; label?: string }) { return <div className="card error-state"><strong>{label}</strong>Check the connection and retry.<div style={{ marginTop: 14 }}><button className="btn secondary small" onClick={retry} data-testid="button-retry"><RotateCcw size={13} /> Retry</button></div></div>; }
function Empty({ title, detail }: { title: string; detail: string }) { return <div className="empty-state"><strong>{title}</strong>{detail}</div>; }
function Metric({ label, value, foot, icon: Icon, tint, trend }: { label: string; value: string; foot: string; icon: typeof Activity; tint: string; trend?: 'up' | 'down' }) {
  return <div className="card metric fade-in" style={{ '--tint': tint } as CSSProperties}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span className="metric-label">{label}</span><Icon size={15} color="hsl(var(--primary))" /></div><div className="metric-value">{value}</div><div className="metric-foot">{trend && (trend === 'up' ? <TrendingUp size={11} className="green" style={{ verticalAlign: 'middle', marginRight: 4 }} /> : <TrendingDown size={11} className="amber" style={{ verticalAlign: 'middle', marginRight: 4 }} />)}{foot}</div></div>;
}
function MiniTrend({ points }: { points: Array<{ day: string; sentiment: number; csat: number }> }) {
  if (!points?.length) return <Empty title="No trend data yet" detail="Trend data will appear when available." />;
  const width = 620, height = 150, pad = 12;
  const line = (key: 'sentiment' | 'csat') => points.map((point, i) => `${pad + (i * (width - 2 * pad)) / Math.max(points.length - 1, 1)},${height - pad - (Math.max(0, Math.min(100, point[key])) / 100) * (height - 2 * pad)}`).join(' ');
  return <svg className="trend-chart" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" role="img" aria-label="Customer experience trend chart">
    {[.25,.5,.75].map((v) => <line key={v} x1="0" x2={width} y1={height * v} y2={height * v} stroke="hsl(var(--border))" strokeDasharray="3 5" />)}
    <polyline points={line('sentiment')} fill="none" stroke="#438bf5" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    <polyline points={line('csat')} fill="none" stroke="#28a987" strokeWidth="2" strokeDasharray="5 5" strokeLinecap="round" strokeLinejoin="round" />
    {points.map((p, i) => <text key={p.day + i} x={pad + (i * (width - 2 * pad)) / Math.max(points.length - 1, 1)} y={height - 1} textAnchor="middle" fontSize="8" fill="hsl(var(--muted-foreground))">{p.day.slice(0, 3)}</text>)}
  </svg>;
}
function JourneyLoop() {
  const steps = [{ n: '01', title: 'Listen', sub: 'Every signal', icon: AudioLines }, { n: '02', title: 'Understand', sub: 'Root cause', icon: Compass }, { n: '03', title: 'Predict', sub: 'Early risk', icon: TrendingDown }, { n: '04', title: 'Recommend', sub: 'Best next step', icon: Lightbulb }, { n: '05', title: 'Act', sub: 'Human approved', icon: CheckCircle2 }, { n: '06', title: 'Learn', sub: 'Measure impact', icon: BarChart3 }];
  return <div className="journey">{steps.map(({ n, title, sub, icon: Icon }) => <div key={n} className="journey-step"><div className="step-num"><Icon size={12} style={{ verticalAlign: 'middle', marginRight: 5 }} />{n}</div><strong>{title}</strong><span>{sub}</span></div>)}</div>;
}
function RiskTag({ value }: { value?: string }) {
  const normalized = (value ?? 'medium').toLowerCase();
  return <span className={cx('tag', normalized)}>{normalized}</span>;
}
function CustomerTable({ customers }: { customers: Customer[] }) {
  if (!customers.length) return <Empty title="No matching customers" detail="Try a broader search or change the risk filter." />;
  return <div className="table-wrap"><table className="data-table"><thead><tr><th>Customer</th><th>Health</th><th>Churn risk</th><th>Sentiment</th><th>Latest signal</th><th>Priority</th></tr></thead><tbody>{customers.map((c) => <tr key={c.id} data-testid={`row-customer-${c.id}`}><td><Link href={`/customers/${encodeURIComponent(c.id)}`} className="customer-link"><div className="person"><span className="avatar">{initials(c.name)}</span><span>{c.name}<small className="muted" style={{ display: 'block', fontSize: 9, fontWeight: 400, marginTop: 2 }}>{c.company}</small></span></div></Link></td><td><span className={c.health < 45 ? 'red mono' : c.health < 70 ? 'amber mono' : 'green mono'}>{c.health}</span></td><td><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div className="bar" style={{ width: 50 }}><i style={{ width: pct(c.churnProbability), background: c.churnProbability > 70 ? '#d4555c' : undefined }} /></div><span className="mono">{pct(c.churnProbability)}</span></div></td><td>{c.sentiment}</td><td>{c.issue}</td><td><RiskTag value={c.priority} /></td></tr>)}</tbody></table></div>;
}
function SarahJourney({ customer }: { customer?: Customer }) {
  if (!customer) return null;
  return <div className="card" style={{ padding: '17px 19px', marginBottom: 16, background: 'linear-gradient(110deg,#eef4ff,hsl(var(--card)) 72%)' }}>
     <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}><div style={{ display: 'flex', alignItems: 'center', gap: 12 }}><div className="avatar" style={{ width: 37, height: 37 }}>{initials(customer.name)}</div><div><div style={{ fontSize: 12, fontWeight: 700 }}>Priority demo · {customer.name}</div><div className="muted" style={{ fontSize: 10, marginTop: 4 }}>The rescue journey: evidence → recommendation → human approval → simulated outcome</div></div></div><Link href={`/customers/${encodeURIComponent(customer.id)}`} className="btn small" data-testid="link-sarah-rescue">Open rescue journey <ArrowRight size={13} /></Link></div>
  </div>;
}
function Dashboard() {
  const overview = useGetCxosOverview({ query: { queryKey: getGetCxosOverviewQueryKey() } });
  const people = useGetCxosCustomers({ risk: 'all' }, { query: { queryKey: getGetCxosCustomersQueryKey({ risk: 'all' }) } });
  const actionQuery = useGetCxosActions({ query: { queryKey: getGetCxosActionsQueryKey() } });
  const customerList = people.data ?? [];
  const sarah = customerList.find((c) => c.name.toLowerCase().includes('sarah williams'));
  const awaiting = (actionQuery.data ?? []).filter((action) => action.status === 'pending');
  const loading = overview.isLoading || people.isLoading;
  return <div className="content">
    <PageHead eyebrow="Executive overview / Current portfolio" title="Experience, in focus." sub="Signals become useful when they arrive early enough to change the outcome." >
      <div className="tag pending"><span className="status-dot" style={{ marginRight: 6 }} /> DEMO AI · SYNTHETIC</div>
    </PageHead>
    <SarahJourney customer={sarah} />
    {loading ? <div className="metrics">{[0,1,2,3].map((i) => <LoadingBlock key={i} />)}</div> : overview.isError ? <QueryError retry={() => overview.refetch()} /> : overview.data && <>
      <section className="metrics" aria-label="Experience metrics">
        <Metric label="Experience health" value={`${overview.data.healthScore}`} foot="Composite score · /100" icon={HeartPulse} tint="#dfeaff" trend="up" />
        <Metric label="Customer satisfaction" value={`${overview.data.csat.toFixed(1)}`} foot="CSAT · last 30 days" icon={BadgeCheck} tint="#ddf4e9" trend="up" />
        <Metric label="Customers at risk" value={`${overview.data.atRiskCustomers}`} foot={`${overview.data.churnRisk.toFixed(1)}% portfolio churn risk`} icon={AlertTriangle} tint="#fff0d8" trend="down" />
        <Metric label="Open experience issues" value={`${overview.data.openIssues}`} foot={`Avg. resolution ${overview.data.resolutionHours.toFixed(1)} hours`} icon={MessageSquare} tint="#ede7ff" />
      </section>
      <section className="metrics metrics-three" aria-label="Additional synthetic CX measures">
        <Metric label="Net promoter score" value={`${overview.data.nps}`} foot="NPS · illustrative demo estimate" icon={TrendingUp} tint="#e4ebff" trend="up" />
        <Metric label="Customer effort score" value={`${overview.data.effortScore.toFixed(1)}`} foot="CES · illustrative demo estimate" icon={Activity} tint="#e8f4ef" trend="down" />
        <Metric label="Demo AI resolutions" value={`${overview.data.aiResolutions}`} foot="Synthetic count · no live automation" icon={Sparkles} tint="#eee8ff" />
      </section>
      <div className="grid-main" style={{ marginBottom: 15 }}>
        <section className="card card-pad"><div className="card-head"><div><div className="card-title">Customer experience trend</div><div className="card-kicker" style={{ marginTop: 4 }}>Sentiment and CSAT · current period</div></div><span className="tag pending">DEMO SIGNALS</span></div><MiniTrend points={overview.data.weeklyTrend} /><div style={{ display: 'flex', gap: 17, fontSize: 9, color: 'hsl(var(--muted-foreground))' }}><span><i style={{ display: 'inline-block', width: 7, height: 7, background: '#438bf5', borderRadius: 8, marginRight: 5 }} />Sentiment</span><span><i style={{ display: 'inline-block', width: 7, height: 7, background: '#28a987', borderRadius: 8, marginRight: 5 }} />CSAT</span><span style={{ marginLeft: 'auto' }}>Directional estimates, not guarantees</span></div></section>
        <section className="card card-pad"><div className="card-head"><div><div className="card-title">Signals worth a closer look</div><div className="card-kicker" style={{ marginTop: 4 }}>Evidence-led, not just a score</div></div><Link href="/intelligence" className="plain-button" style={{ textDecoration: 'none', padding: '6px 8px', minHeight: 28 }}>Explore <ArrowRight size={12} /></Link></div>
          {(overview.data.healthFactors ?? []).slice(0, 4).map((factor, i) => <div className="signal-row" key={factor.label} data-testid={`signal-factor-${i}`}><span className="signal-icon">{factor.direction === 'down' ? <ArrowDownRight /> : factor.direction === 'up' ? <ArrowUpRight /> : <Activity />}</span><span className="signal-info"><strong>{factor.label}</strong><span>{factor.value}</span></span><span className={factor.direction === 'down' ? 'red mono' : factor.direction === 'up' ? 'green mono' : 'muted mono'}>{factor.change}</span></div>)}
        </section>
      </div>
    </>}
    <section className="card card-pad" style={{ marginBottom: 15 }}><div className="card-head"><div><div className="card-title">One operating loop. No black box.</div><div className="card-kicker" style={{ marginTop: 4 }}>CXOS carries context from first signal through verified learning.</div></div></div><JourneyLoop /></section>
    <section className="card card-pad" style={{ marginBottom: 15 }}><div className="card-head"><div><div className="card-title">Customers that need a human</div><div className="card-kicker" style={{ marginTop: 4 }}>Risk ranked · prioritise the next right conversation</div></div><Link className="plain-button" href="/customers" style={{ textDecoration: 'none' }}>All customers <ArrowRight size={13} /></Link></div>{people.isLoading ? <LoadingBlock /> : people.isError ? <QueryError retry={() => people.refetch()} /> : <CustomerTable customers={customerList.slice(0, 5)} />}</section>
    <section className="card card-pad"><div className="card-head"><div><div className="card-title">Human action review</div><div className="card-kicker" style={{ marginTop: 4 }}>Recommendations never execute without your approval</div></div><Link className="plain-button" href="/actions" style={{ textDecoration: 'none' }}>{awaiting.length} awaiting <ArrowRight size={13} /></Link></div>{actionQuery.isLoading ? <LoadingBlock /> : actionQuery.isError ? <QueryError retry={() => actionQuery.refetch()} /> : awaiting.length ? awaiting.slice(0, 2).map((a) => <ActionPreview action={a} key={a.id} />) : <Empty title="Review queue is clear" detail="New recommendations will appear here when evidence warrants an action." />}</section>
  </div>;
}
function ActionPreview({ action }: { action: RecommendedAction }) {
  return <div className="signal-row"><span className="signal-icon"><Lightbulb /></span><span className="signal-info"><strong>{action.title}</strong><span>{action.customerName} · {action.impact}</span></span><RiskTag value={action.severity} /></div>;
}
function CustomersPage() {
  const [search, setSearch] = useState('');
  const [risk, setRisk] = useState('all');
  const params = useMemo(() => ({ ...(search.trim() ? { search: search.trim() } : {}), risk: risk as 'all' | 'high' | 'medium' | 'low' }), [search, risk]);
  const query = useGetCxosCustomers(params, { query: { queryKey: getGetCxosCustomersQueryKey(params) } });
  const sarah = query.data?.find((c) => c.name.toLowerCase().includes('sarah williams'));
  return <div className="content"><PageHead eyebrow="Customer portfolio / risk-ranked" title="Know who needs you." sub="A living view of relationship health, early dissatisfaction, and the evidence behind both." />
    <SarahJourney customer={sarah} />
    <div className="card card-pad"><div className="card-head" style={{ flexWrap: 'wrap' }}><div><div className="card-title">Customer portfolio</div><div className="card-kicker" style={{ marginTop: 4 }}>{query.data?.length ?? 0} matching synthetic profiles</div></div><div className="filter-row"><label className="searchbox"><Search size={14} /><input aria-label="Search customers" placeholder="Search name, company, issue…" value={search} onChange={(e) => setSearch(e.target.value)} data-testid="input-customer-search" /></label><select className="select" value={risk} onChange={(e) => setRisk(e.target.value)} aria-label="Filter risk" data-testid="select-customer-risk"><option value="all">All risk</option><option value="high">High risk</option><option value="medium">Medium risk</option><option value="low">Low risk</option></select></div></div>
      {query.isLoading ? <LoadingBlock /> : query.isError ? <QueryError retry={() => query.refetch()} /> : <CustomerTable customers={query.data ?? []} />}
    </div>
  </div>;
}
function ProfilePage() {
  const params = useParams<{ customerId: string }>();
  const id = params.customerId ?? '';
  const profile = useGetCxosCustomer(id, { query: { enabled: !!id, queryKey: getGetCxosCustomerQueryKey(id) } });
  const actionQuery = useGetCxosActions({ query: { queryKey: getGetCxosActionsQueryKey() } });
  const decide = useDecideCxosAction();
  const rescue = useExecuteCxosRescue();
  const client = useQueryClient();
  const [result, setResult] = useState<Awaited<ReturnType<typeof rescue.mutateAsync>> | null>(null);
  const customer = profile.data?.customer;
  const rescueAction = actionQuery.data?.find((action) => action.customerId === id);
  const approvalComplete = rescueAction?.status === 'approved' || rescueAction?.status === 'modified';
  const approveRescue = () => {
    if (!rescueAction) return;
    decide.mutate({ actionId: rescueAction.id, data: { decision: 'approve' } }, { onSuccess: () => {
      client.invalidateQueries({ queryKey: getGetCxosActionsQueryKey() });
      client.invalidateQueries({ queryKey: getGetCxosAuditQueryKey() });
    } });
  };
  const execute = () => rescue.mutate({ customerId: id }, { onSuccess: (value) => {
    setResult(value);
    [getGetCxosCustomerQueryKey(id), getGetCxosCustomersQueryKey(), getGetCxosOverviewQueryKey(), getGetCxosAuditQueryKey(), getGetCxosActionsQueryKey()].forEach((queryKey) => client.invalidateQueries({ queryKey }));
  } });
  if (profile.isLoading) return <div className="content"><LoadingBlock /></div>;
  if (profile.isError || !profile.data) return <div className="content"><PageHead eyebrow="Customer profile" title="Customer unavailable" /><QueryError retry={() => profile.refetch()} /></div>;
  return <div className="content"><PageHead eyebrow="Customer 360 / evidence and context" title={customer?.name ?? 'Customer profile'} sub={`${customer?.company} · ${customer?.plan} plan · ${profile.data.conversationCount} conversations`}><Link className="plain-button" href="/customers" style={{ textDecoration: 'none' }}><ArrowRight size={13} style={{ transform: 'rotate(180deg)' }} /> Portfolio</Link></PageHead>
    <div className="grid-main" style={{ gridTemplateColumns: 'minmax(0,1.25fr) minmax(270px,.75fr)', marginBottom: 15 }}>
      <section className="card card-pad"><div className="card-head"><div><div className="card-title">Relationship health</div><div className="card-kicker" style={{ marginTop: 4 }}>A summary grounded in recent interactions</div></div><RiskTag value={customer?.priority} /></div>
        <div style={{ display: 'flex', gap: 22, alignItems: 'center', padding: '7px 0 18px' }}><div style={{ textAlign: 'center', minWidth: 92 }}><div className={cx('mono', (customer?.health ?? 0) < 45 ? 'red' : 'blue')} style={{ fontSize: 34, fontWeight: 700 }}>{customer?.health}</div><div className="muted" style={{ fontSize: 9 }}>HEALTH / 100</div></div><div style={{ height: 48, width: 1, background: 'hsl(var(--border))' }} /><div><div style={{ fontSize: 11, fontWeight: 700 }}>{customer?.sentiment} sentiment · {pct(customer?.churnProbability)} churn risk</div><div className="muted" style={{ fontSize: 10, marginTop: 7 }}>Last contact {displayDate(customer?.lastContact)} · via {customer?.channel}</div><div className="muted" style={{ fontSize: 10, marginTop: 6 }}>Lifetime value ${customer?.lifetimeValue.toLocaleString()}</div></div></div>
        <div className="callout"><strong style={{ display: 'block', marginBottom: 4 }}>What CXOS sees</strong>{profile.data.summary}</div>
        <div style={{ marginTop: 16 }}><div className="card-title" style={{ marginBottom: 9 }}>Risk evidence</div><div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>{customer?.riskFactors?.map((f) => <span className="tag warning" key={f}>{f}</span>)}</div></div>
      </section>
      <section className="card card-pad"><div className="card-head"><div><div className="card-title">Recommended next step</div><div className="card-kicker" style={{ marginTop: 4 }}>Human approval required</div></div><span className="signal-icon"><WandSparkles size={15} /></span></div><div style={{ fontSize: 12, fontWeight: 700, lineHeight: 1.5 }}>{customer?.recommendation}</div><p className="muted" style={{ fontSize: 10, lineHeight: 1.7 }}>Grounded in the customer’s recent history and risk factors. CXOS will not take action on its own.</p>
         {actionQuery.isLoading ? <div className="muted" style={{ fontSize: 10 }}>Checking approval status…</div> : rescueAction?.status === 'pending' ? <button className="btn" onClick={approveRescue} disabled={decide.isPending} data-testid="button-approve-rescue">{decide.isPending ? <><LoaderCircle size={14} />Recording approval…</> : <><CheckCircle2 size={14} />Approve rescue plan</>}</button> : approvalComplete ? <button className="btn" onClick={execute} disabled={rescue.isPending || !!result} data-testid="button-execute-rescue">{rescue.isPending ? <><LoaderCircle size={14} />Simulating rescue…</> : result ? <><Check size={14} />Rescue simulated</> : <><Sparkles size={14} />Execute rescue plan</>}</button> : rescueAction?.status === 'executed' ? <span className="tag executed">Rescue plan executed</span> : <div className="muted" style={{ fontSize: 10 }}>No approved rescue action is available. Review a recommendation in Action review.</div>}
         {(rescue.isError || decide.isError) && <div className="red" role="alert" style={{ fontSize: 10, marginTop: 9 }}>The review or rescue action did not complete. Try again.</div>}
        {result && <div className="callout" style={{ marginTop: 13 }}><strong>Simulated outcome · {result.previousHealth} → {result.health} health</strong><div style={{ marginTop: 4 }}>{result.impact}</div><div className="mono" style={{ fontSize: 9, marginTop: 7 }}>Audit {result.auditId}</div></div>}
      </section>
    </div>
    <section className="card card-pad"><div className="card-head"><div><div className="card-title">Conversation timeline</div><div className="card-kicker" style={{ marginTop: 4 }}>Cross-channel context, in sequence</div></div><span className="tag">{profile.data.timeline.length} EVENTS</span></div>
       {profile.data.timeline.length ? <div className="timeline">{profile.data.timeline.map((event) => <div className="timeline-item" key={event.id}><time>{displayDate(event.date)} · {event.channel}</time><strong style={{ display: 'block', marginTop: 4 }}>{event.title}</strong><p>{event.detail}</p>{event.type === 'security' ? <span className="tag critical"><ShieldCheck size={11} style={{ verticalAlign: 'middle', marginRight: 4 }} />Suspicious content blocked</span> : <RiskTag value={event.sentiment} />}</div>)}</div> : <Empty title="No timeline events" detail="Interactions will appear here when data is available." />}
    </section>
  </div>;
}
function InboxPage() {
  const query = useGetCxosCustomers({ risk: 'all' }, { query: { queryKey: getGetCxosCustomersQueryKey({ risk: 'all' }) } });
  const actions = useGetCxosActions({ query: { queryKey: getGetCxosActionsQueryKey() } });
  const client = useQueryClient();
  const decide = useDecideCxosAction();
  const resolve = useResolveCxosCustomer();
  const escalate = useEscalateCxosCustomer();
  const ask = useAskCxosCopilot();
  const [selected, setSelected] = useState('');
  const [filter, setFilter] = useState('all');
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [message, setMessage] = useState('');
  const [mobileListOpen, setMobileListOpen] = useState(true);
  const all = query.data ?? [];
  const filtered = all.filter((c) => filter === 'all' || (filter === 'high' ? c.churnProbability >= 70 : filter === 'medium' ? c.churnProbability >= 45 && c.churnProbability < 70 : c.churnProbability < 45));
  const active = filtered.find((c) => c.id === selected) ?? filtered[0];
  const activeAction = actions.data?.find((action) => action.customerId === active?.id);
  useEffect(() => { if (active && selected !== active.id) setSelected(active.id); }, [active, selected]);
  useEffect(() => { setEditing(false); setDraft(active ? localStorage.getItem(`cxos-draft:${active.id}`) ?? '' : ''); setMessage(''); }, [active?.id]);
  const acceptRecommendation = () => {
    if (!activeAction || activeAction.status !== 'pending') return;
    decide.mutate({ actionId: activeAction.id, data: { decision: 'approve' } }, { onSuccess: () => {
      client.invalidateQueries({ queryKey: getGetCxosActionsQueryKey() });
      client.invalidateQueries({ queryKey: getGetCxosAuditQueryKey() });
      setMessage('Recommendation approved by the demo reviewer.');
    } });
  };
  const editResponse = () => {
    if (!active) return;
    setEditing(true);
    setMessage('');
    if (draft.trim()) return;
    ask.mutate({ data: { message: `Draft a concise, empathetic customer support response about this issue: ${active.issue}. Do not send it.` } }, {
      onSuccess: (response) => setDraft(response.answer),
      onError: () => setMessage('Could not prepare a draft. Try again.'),
    });
  };
  const saveDraft = () => {
    if (!active || !draft.trim()) return;
    localStorage.setItem(`cxos-draft:${active.id}`, draft.trim());
    setMessage('Draft saved in this browser only. It has not been sent.');
  };
  const resolveIssue = () => {
    if (!active) return;
    resolve.mutate({ customerId: active.id }, { onSuccess: () => {
      [getGetCxosCustomersQueryKey({ risk: 'all' }), getGetCxosCustomerQueryKey(active.id), getGetCxosOverviewQueryKey(), getGetCxosAuditQueryKey()].forEach((queryKey) => client.invalidateQueries({ queryKey }));
      setMessage('One synthetic open issue was marked resolved.');
    } });
  };
  const escalateIssue = () => {
    if (!active) return;
    escalate.mutate({ customerId: active.id }, { onSuccess: () => {
      [getGetCxosCustomersQueryKey({ risk: 'all' }), getGetCxosCustomerQueryKey(active.id), getGetCxosAuditQueryKey()].forEach((queryKey) => client.invalidateQueries({ queryKey }));
      setMessage('Escalation recorded in the synthetic demo workspace.');
    } });
  };
  return <div className="content"><PageHead eyebrow="Unified conversations / action context" title="Inbox with context." sub="See the signal, the history, and the next best human action in one place." />
    {query.isLoading || actions.isLoading ? <LoadingBlock /> : query.isError || actions.isError ? <QueryError retry={() => { query.refetch(); actions.refetch(); }} /> : <div className="card inbox-layout" style={{ display: 'grid', gridTemplateColumns: 'minmax(230px,.75fr) minmax(0,1.4fr)', minHeight: 510, overflow: 'hidden' }}>
      <aside className={cx('inbox-list', !mobileListOpen && 'mobile-hidden')} style={{ borderRight: '1px solid hsl(var(--border))', padding: 15 }}><div className="card-head"><div className="card-title">Customer threads <span className="tag" style={{ marginLeft: 5 }}>{filtered.length}</span></div><button className="icon-button" aria-label="Filter conversations" onClick={() => setFilter(filter === 'all' ? 'high' : filter === 'high' ? 'medium' : filter === 'medium' ? 'low' : 'all')} data-testid="button-inbox-filter"><Filter size={14} /></button></div><div style={{ display: 'flex', gap: 5, marginBottom: 11, overflow: 'auto' }}>{['all','high','medium','low'].map((f) => <button key={f} onClick={() => setFilter(f)} className={cx('tag', filter === f && 'pending')} style={{ border: 0 }} data-testid={`button-inbox-${f}`}>{f}</button>)}</div>
        {filtered.map((c) => <button key={c.id} onClick={() => { setSelected(c.id); setMobileListOpen(false); }} className="signal-row" style={{ width: '100%', textAlign: 'left', background: c.id === active?.id ? 'hsl(var(--accent))' : 'transparent', border: 0, cursor: 'pointer', borderRadius: 8, padding: 10 }} data-testid={`button-conversation-${c.id}`}><span className="avatar">{initials(c.name)}</span><span className="signal-info"><strong>{c.name}</strong><span>{c.issue}</span></span><span className="mono muted" style={{ fontSize: 8 }}>{displayDate(c.lastContact).split(' ·')[0]}</span></button>)}
      </aside>
      <div className={cx('inbox-detail', mobileListOpen && 'mobile-hidden')} style={{ padding: 23 }}>{active ? <><button className="mobile-back-inbox" onClick={() => setMobileListOpen(true)}><ArrowRight size={12} style={{ transform: 'rotate(180deg)' }} /> Back to customer threads</button><div className="card-head"><div className="person"><span className="avatar">{initials(active.name)}</span><div><div style={{ fontWeight: 700, fontSize: 13 }}>{active.name}</div><div className="muted" style={{ fontSize: 9, marginTop: 3 }}>{active.company} · {active.channel}</div></div></div><RiskTag value={active.priority} /></div>
        <div style={{ borderTop: '1px solid hsl(var(--border))', padding: '17px 0' }}><div className="eyebrow" style={{ marginBottom: 6 }}>Latest detected issue</div><div style={{ fontSize: 14, fontWeight: 700 }}>{active.issue}</div><p className="muted" style={{ fontSize: 11, lineHeight: 1.65 }}>Sentiment is <strong>{active.sentiment.toLowerCase()}</strong>. CXOS flags {pct(active.churnProbability)} churn probability based on {active.riskFactors?.length ?? 0} observed risk signals.</p><div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{active.riskFactors.map((f) => <span key={f} className="tag warning">{f}</span>)}</div></div>
         <div className="callout"><strong>Recommended human action</strong><br />{active.recommendation}<div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, alignItems: 'center' }}><span className="muted">Health {active.health} / 100 · ${active.lifetimeValue.toLocaleString()} LTV</span><Link className="btn small" href={`/customers/${encodeURIComponent(active.id)}`} style={{ textDecoration: 'none' }}>Open customer 360 <ArrowRight size={12} /></Link></div></div>
         <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 15 }}>
           <button className="btn small" onClick={acceptRecommendation} disabled={!activeAction || activeAction.status !== 'pending' || decide.isPending} data-testid="button-inbox-accept">{decide.isPending ? 'Approving…' : activeAction?.status === 'approved' || activeAction?.status === 'modified' ? 'Recommendation approved' : 'Accept recommendation'}</button>
           <button className="btn secondary small" onClick={editing ? saveDraft : editResponse} disabled={ask.isPending || (editing && !draft.trim())} data-testid="button-inbox-edit-response">{ask.isPending ? 'Preparing draft…' : editing ? 'Save draft' : 'Edit response'}</button>
           <button className="btn secondary small" onClick={escalateIssue} disabled={escalate.isPending} data-testid="button-inbox-escalate">{escalate.isPending ? 'Escalating…' : 'Escalate'}</button>
           <button className="btn secondary small" onClick={resolveIssue} disabled={resolve.isPending} data-testid="button-inbox-resolve">{resolve.isPending ? 'Resolving…' : 'Resolve issue'}</button>
         </div>
         {editing && <div style={{ marginTop: 14 }}><label htmlFor="inbox-draft" className="card-title" style={{ display: 'block', marginBottom: 7 }}>Editable response draft <span className="muted" style={{ fontWeight: 400 }}>· not sent</span></label><textarea id="inbox-draft" className="input" rows={4} value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Draft a customer response…" data-testid="textarea-inbox-draft" /></div>}
         {(message || decide.isError || resolve.isError || escalate.isError) && <div role={decide.isError || resolve.isError || escalate.isError ? 'alert' : 'status'} className={decide.isError || resolve.isError || escalate.isError ? 'red' : 'muted'} style={{ fontSize: 10, marginTop: 10 }}>{message || 'The action did not complete. Try again.'}</div>}
      </> : <Empty title="No conversations in this view" detail="Change the priority filter to see more." />}</div>
    </div>}
  </div>;
}
function ActionsPage() {
  const query = useGetCxosActions({ query: { queryKey: getGetCxosActionsQueryKey() } });
  const decide = useDecideCxosAction();
  const client = useQueryClient();
  const [busy, setBusy] = useState('');
  const [noteFor, setNoteFor] = useState('');
  const [note, setNote] = useState('');
  const decideAction = (action: RecommendedAction, decision: 'approve' | 'modify' | 'reject') => {
    setBusy(action.id);
    decide.mutate({ actionId: action.id, data: { decision, ...(noteFor === action.id && note ? { note } : {}) } }, { onSuccess: () => {
      client.invalidateQueries({ queryKey: getGetCxosActionsQueryKey() }); client.invalidateQueries({ queryKey: getGetCxosAuditQueryKey() }); setBusy('');
      if (noteFor === action.id) { setNoteFor(''); setNote(''); }
    }, onError: () => setBusy('error') });
  };
  const items = query.data ?? [];
  return <div className="content"><PageHead eyebrow="Human-in-the-loop / review queue" title="Good judgment, in the loop." sub="Every recommendation is evidence-backed. Nothing is sent or changed until a person decides." />
    <div className="callout" style={{ marginBottom: 15 }}><LockKeyhole size={14} style={{ verticalAlign: 'middle', marginRight: 7 }} /><strong>Human approval is the control.</strong> Approving records your decision; executing a rescue is a separate, explicit demo action.</div>
    {query.isLoading ? <LoadingBlock /> : query.isError ? <QueryError retry={() => query.refetch()} /> : !items.length ? <div className="card"><Empty title="Nothing needs review" detail="When CXOS finds a strong, actionable signal, the recommendation will appear here with its supporting evidence." /></div> : items.map((action) => <article className="card action-card" key={action.id} data-testid={`card-action-${action.id}`}><div className="action-main"><div className="action-meta" style={{ marginBottom: 9 }}><RiskTag value={action.severity} /><span className={cx('tag', action.status)}>{action.status}</span><Link href={`/customers/${encodeURIComponent(action.customerId)}`} className="customer-link" style={{ fontSize: 10 }}>{action.customerName} <ArrowRight size={10} style={{ verticalAlign: 'middle' }} /></Link></div><h3>{action.title}</h3><p><strong>Evidence</strong> · {action.evidence}</p><p><strong>Recommendation</strong> · {action.recommendation}</p><div className="action-meta"><span className="muted" style={{ fontSize: 10 }}>Expected impact</span><span className="green" style={{ fontSize: 10, fontWeight: 700 }}>{action.impact}</span></div>
      {noteFor === action.id && <div style={{ marginTop: 12 }}><input className="select" style={{ width: '100%' }} maxLength={300} placeholder="Optional note for this decision (max 300 characters)" value={note} onChange={(e) => setNote(e.target.value)} data-testid={`input-action-note-${action.id}`} /></div>}
    </div><div className="action-side"><span className="mono muted">ID {action.id.slice(0, 8)}</span>{action.status === 'pending' ? <div className="action-buttons"><button className="btn secondary small" disabled={busy === action.id} onClick={() => { setNoteFor(action.id); if (noteFor === action.id) decideAction(action, 'modify'); }} data-testid={`button-modify-${action.id}`}>{noteFor === action.id ? 'Save change' : 'Modify'}</button><button className="btn secondary small" disabled={busy === action.id} onClick={() => decideAction(action, 'reject')} data-testid={`button-reject-${action.id}`}>Reject</button><button className="btn small" disabled={busy === action.id} onClick={() => decideAction(action, 'approve')} data-testid={`button-approve-${action.id}`}>{busy === action.id ? 'Saving…' : 'Approve'}</button></div> : <span className={cx('tag', action.status)}>{action.status}</span>}</div></article>)}
    {busy === 'error' && <div className="red" role="alert">Decision could not be saved. Retry the action.</div>}
  </div>;
}
function IntelligencePage() {
  const query = useGetCxosIntelligence({ query: { queryKey: getGetCxosIntelligenceQueryKey() } });
  const data = query.data;
  return <div className="content"><PageHead eyebrow="Experience intelligence / voice of customer" title="Understand the why." sub="Turn recurring friction into a measurable journey improvement—not just another sentiment score." />
    {query.isLoading ? <LoadingBlock /> : query.isError ? <QueryError retry={() => query.refetch()} /> : data && <>
      <div className="grid-main" style={{ marginBottom: 15 }}>
        <section className="card card-pad"><div className="card-head"><div><div className="card-title">Sentiment trajectory</div><div className="card-kicker" style={{ marginTop: 4 }}>Cross-channel · trend is directional</div></div><span className="tag pending">DEMO DATA</span></div><MiniTrend points={data.sentimentTrend} /></section>
        <section className="card card-pad"><div className="card-head"><div><div className="card-title">Emotion mix</div><div className="card-kicker" style={{ marginTop: 4 }}>What customers are expressing</div></div><AudioLines size={15} className="blue" /></div>
          <div className="emotions" style={{ margin: '18px 0' }}>{data.emotions.map((emotion) => <i key={emotion.emotion} style={{ width: pct(emotion.share), background: emotion.color }} title={`${emotion.emotion} ${pct(emotion.share)}`} />)}</div>
          {data.emotions.map((emotion) => <div className="signal-row" key={emotion.emotion}><span className="signal-icon" style={{ background: `${emotion.color}1c`, color: emotion.color }}><span style={{ width: 8, height: 8, background: emotion.color, borderRadius: '50%' }} /></span><span className="signal-info"><strong>{emotion.emotion}</strong></span><span className="mono">{pct(emotion.share)}</span></div>)}
        </section>
      </div>
      <section className="card card-pad" style={{ marginBottom: 15 }}><div className="card-head"><div><div className="card-title">Root causes & complaint themes</div><div className="card-kicker" style={{ marginTop: 4 }}>Ranked by share of observed feedback · every theme links to evidence</div></div></div>
        {!data.themes.length ? <Empty title="No themes yet" detail="Themes will surface as voice-of-customer data becomes available." /> : data.themes.map((theme, index) => <div key={theme.name} style={{ display: 'grid', gridTemplateColumns: '32px minmax(0,1fr) 130px', gap: 12, padding: '15px 0', borderTop: '1px solid hsl(var(--border))', alignItems: 'start' }}><span className="mono blue">0{index + 1}</span><div><div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}><strong style={{ fontSize: 12 }}>{theme.name}</strong><RiskTag value={theme.sentiment} /></div><div className="muted" style={{ fontSize: 10, margin: '6px 0 10px' }}>{theme.count} mentions · trend {theme.trend > 0 ? '+' : ''}{theme.trend}%</div><div className="bar" style={{ maxWidth: 390 }}><i style={{ width: pct(theme.share) }} /></div>
          {theme.causes.map((cause) => <div key={cause.label} style={{ marginTop: 10, padding: '9px 11px', background: 'hsl(var(--muted))', borderRadius: 7, fontSize: 10 }}><strong>{cause.label}</strong><span className="muted"> · {pct(cause.confidence)} confidence</span><div className="muted" style={{ marginTop: 4, lineHeight: 1.5 }}>{cause.evidence}</div></div>)}
          {theme.examples?.[0] && <div className="muted" style={{ fontSize: 10, fontStyle: 'italic', marginTop: 9 }}>“{theme.examples[0]}”</div>}</div><div style={{ textAlign: 'right' }}><div className="mono" style={{ fontSize: 13 }}>{pct(theme.share)}</div><div className="muted" style={{ fontSize: 9 }}>feedback share</div></div></div>)}
      </section>
      <section className="card card-pad" style={{ marginBottom: 15 }}><div className="card-head"><div><div className="card-title">Journey friction map</div><div className="card-kicker" style={{ marginTop: 4 }}>Locate where effort compounds and customers fall away</div></div></div><div className="table-wrap"><table className="data-table"><thead><tr><th>Journey stage</th><th>Sentiment</th><th>Friction</th><th>Conversion</th><th>Complaints</th><th>Opportunity</th></tr></thead><tbody>{data.journey.map((stage) => <tr key={stage.name}><td><strong>{stage.name}</strong></td><td>{stage.sentiment}</td><td><div className="bar" style={{ width: 62 }}><i style={{ width: pct(stage.friction), background: '#d69a36' }} /></div></td><td>{pct(stage.conversion)}</td><td>{stage.complaints}</td><td style={{ maxWidth: 250, whiteSpace: 'normal' }}>{stage.opportunity}</td></tr>)}</tbody></table></div></section>
      <section className="card card-pad"><div className="card-head"><div><div className="card-title">Voice, in their words</div><div className="card-kicker" style={{ marginTop: 4 }}>Synthetic feedback examples · inspect the theme before acting</div></div></div><div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 10 }}>{data.reviews.map((review, i) => <blockquote key={`${review.source}-${i}`} style={{ margin: 0, padding: 15, border: '1px solid hsl(var(--border))', borderRadius: 9 }}><p style={{ fontSize: 11, lineHeight: 1.65, margin: '0 0 13px' }}>“{review.quote}”</p><div className="muted" style={{ fontSize: 9 }}>{review.source} · {displayDate(review.date)}</div><div className="action-meta" style={{ marginTop: 9 }}><span className="tag">{review.theme}</span><RiskTag value={review.sentiment} /></div></blockquote>)}</div></section>
    </>}
  </div>;
}
function CopilotPage() {
  const ask = useAskCxosCopilot();
  const [message, setMessage] = useState('');
  const [answer, setAnswer] = useState<Awaited<ReturnType<typeof ask.mutateAsync>> | null>(null);
  const prompts = ['Who should we reach out to first?', 'What is driving negative sentiment?', 'Summarize Sarah Williams’ risk'];
  const submit = (value = message) => {
    if (!value.trim() || value.trim().length > 600) return;
    ask.mutate({ data: { message: value.trim() } }, { onSuccess: (data) => { setAnswer(data); setMessage(''); } });
  };
  return <div className="content"><PageHead eyebrow="Grounded assistant / Demo AI" title="Ask with evidence." sub="A CX analyst that answers from this demo workspace, shows its sources, and names its limits." />
    <div className="callout" style={{ marginBottom: 15 }}><Sparkles size={14} style={{ verticalAlign: 'middle', marginRight: 7 }} /><strong>Demo AI, not a live provider.</strong> Responses are generated for this synthetic workspace and may be incomplete. Verify before acting.</div>
    <section className="card" style={{ maxWidth: 860, margin: '0 auto', minHeight: 430, display: 'flex', flexDirection: 'column', padding: 22 }}>
      <div style={{ display: 'flex', gap: 11, alignItems: 'center', paddingBottom: 16, borderBottom: '1px solid hsl(var(--border))' }}><span className="brand-mark"><Bot size={17} /></span><div><div style={{ fontSize: 12, fontWeight: 700 }}>CXOS Copilot</div><div className="muted" style={{ fontSize: 9, marginTop: 3 }}>Grounded in customer, action, and intelligence data</div></div><span className="tag pending" style={{ marginLeft: 'auto' }}>DEMO AI</span></div>
      <div style={{ flex: 1, padding: '23px 0' }}>
        {!answer && <div className="empty-state"><div className="signal-icon" style={{ margin: '0 auto 12px', width: 40, height: 40 }}><WandSparkles size={18} /></div><strong>Start with a question that leads to action.</strong>Copilot will show supporting evidence and confidence—never a black-box instruction.<div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 7, marginTop: 17 }}>{prompts.map((prompt) => <button key={prompt} className="plain-button" style={{ fontSize: 10 }} onClick={() => { setMessage(prompt); submit(prompt); }} data-testid={`button-prompt-${prompts.indexOf(prompt)}`}>{prompt}</button>)}</div></div>}
        {ask.isPending && <div className="signal-row"><span className="signal-icon"><Sparkles /></span><span className="signal-info"><strong>Reviewing workspace evidence…</strong><span>Demo AI is preparing a grounded answer</span></span></div>}
        {ask.isError && <div className="error-state" role="alert"><strong>Copilot could not answer</strong>Try a different question or retry.<button className="btn secondary small" style={{ marginTop: 10 }} onClick={() => submit()} data-testid="button-retry-copilot">Retry</button></div>}
        {answer && !ask.isPending && <div style={{ maxWidth: 700 }}><div className="callout" style={{ background: 'hsl(var(--muted))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}>{answer.answer}</div><div style={{ display: 'flex', gap: 9, alignItems: 'center', margin: '14px 0 9px' }}><div className="card-title">Evidence</div><span className="tag">{pct(answer.confidence)} confidence</span></div><ul style={{ paddingLeft: 18, margin: 0 }}>{answer.evidence.map((item, i) => <li key={`${item}-${i}`} style={{ fontSize: 10, lineHeight: 1.6, margin: '6px 0' }}>{item}</li>)}</ul><div className="muted" style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid hsl(var(--border))', fontSize: 10 }}><strong>Limitation</strong> · {answer.limitation}</div></div>}
      </div>
      <form onSubmit={(e) => { e.preventDefault(); submit(); }} style={{ display: 'flex', gap: 8, border: '1px solid hsl(var(--border))', borderRadius: 10, padding: 7, background: 'hsl(var(--background))' }}><input value={message} onChange={(e) => setMessage(e.target.value)} maxLength={600} placeholder="Ask about customer risk, themes, or next steps…" aria-label="Ask CXOS Copilot" style={{ flex: 1, minWidth: 0, border: 0, outline: 0, background: 'transparent', padding: '0 8px', color: 'hsl(var(--foreground))', fontSize: 11 }} data-testid="input-copilot" /><span className="mono muted" style={{ alignSelf: 'center', fontSize: 8 }}>{message.length}/600</span><button className="btn small" type="submit" disabled={ask.isPending || !message.trim()} data-testid="button-ask-copilot"><Send size={13} />Ask</button></form>
      <div className="muted" style={{ fontSize: 9, textAlign: 'center', marginTop: 9 }}>Answers can be wrong. Check the evidence and use human judgment.</div>
    </section>
  </div>;
}
function TrustPage() {
  const audit = useGetCxosAudit({ query: { queryKey: getGetCxosAuditQueryKey() } });
  const health = useHealthCheck({ query: { queryKey: getHealthCheckQueryKey() } });
  return <div className="content"><PageHead eyebrow="Governance / transparency by design" title="Trust, made inspectable." sub="A clear record of what CXOS observed, recommended, and a person chose to do." />
    <div className="metrics" style={{ gridTemplateColumns: 'repeat(3,minmax(0,1fr))' }}><Metric label="Action control" value="Human-led" foot="No recommendation executes itself" icon={LockKeyhole} tint="#e2edff" /><Metric label="Data mode" value="Synthetic" foot="Purpose-built demo workspace" icon={FileText} tint="#eee9ff" /><Metric label="API status" value={health.data?.status ?? (health.isLoading ? 'Checking…' : 'Unavailable')} foot="Workspace health check" icon={Activity} tint="#e2f5eb" /></div>
    <div className="grid-main" style={{ marginBottom: 15 }}>
      <section className="card card-pad"><div className="card-head"><div><div className="card-title">Safety boundaries</div><div className="card-kicker" style={{ marginTop: 4 }}>What the product does—and does not do</div></div><ShieldCheck size={16} className="green" /></div>
        {[['Recommendations are not actions','A person reviews, approves, modifies, or rejects every proposed intervention.'],['Evidence travels with the recommendation','Risk factors, conversation signals, and expected impact remain visible at review time.'],['Demo AI is explicit','This app does not claim a live model provider. Answers are synthetic, may be incomplete, and show limitations.'],['Outcome estimates are not guarantees','Rescue results are simulated for demonstration and should not be interpreted as causal proof.']].map(([title, detail]) => <div className="signal-row" key={title}><span className="signal-icon"><Check size={14} /></span><span className="signal-info"><strong>{title}</strong><span>{detail}</span></span></div>)}
      </section>
      <section className="card card-pad"><div className="card-head"><div><div className="card-title">Demo data governance</div><div className="card-kicker" style={{ marginTop: 4 }}>Safe to explore, easy to reset</div></div><Settings2 size={16} className="blue" /></div><p className="muted" style={{ fontSize: 10, lineHeight: 1.65 }}>All customer profiles, conversations, feedback, and rescue outcomes shown here are synthetic. Resetting the demo restores the initial state.</p><div className="signal-row"><span className="signal-icon"><BadgeCheck /></span><span className="signal-info"><strong>Audit trail enabled</strong><span>Review decisions and simulated outcomes are recorded.</span></span></div><div className="signal-row"><span className="signal-icon"><RotateCcw /></span><span className="signal-info"><strong>Reset available</strong><span>Use the reset control in the top bar to restore the demo.</span></span></div></section>
    </div>
    <section className="card card-pad"><div className="card-head"><div><div className="card-title">Audit trail</div><div className="card-kicker" style={{ marginTop: 4 }}>Human decisions and demo events · newest first</div></div><span className="tag">{audit.data?.length ?? 0} ENTRIES</span></div>
      {audit.isLoading ? <LoadingBlock /> : audit.isError ? <QueryError retry={() => audit.refetch()} /> : !audit.data?.length ? <Empty title="No audit events yet" detail="Approvals, changes, and simulated rescues will be recorded here." /> : <div className="table-wrap"><table className="data-table"><thead><tr><th>Time</th><th>Actor</th><th>Action</th><th>Subject</th><th>Category</th><th>Detail</th></tr></thead><tbody>{audit.data.map((entry) => <tr key={entry.id} data-testid={`row-audit-${entry.id}`}><td className="mono" style={{ whiteSpace: 'nowrap' }}>{displayDate(entry.timestamp)}</td><td>{entry.actor}</td><td><strong>{entry.action}</strong></td><td>{entry.subject}</td><td><span className="tag">{entry.category}</span></td><td style={{ maxWidth: 300, whiteSpace: 'normal' }}>{entry.detail}</td></tr>)}</tbody></table></div>}
    </section>
  </div>;
}
function WelcomePage() {
  return <div className="content welcome-page">
    <section className="card welcome-hero">
      <div className="welcome-copy">
        <span className="tag pending"><span className="status-dot" style={{ marginRight: 6 }} />CXOS · EXPERIENCE OPERATIONS</span>
        <h1>Turn every customer signal into a better experience.</h1>
        <p>Find the early warning in conversations, understand what caused it, and help a person take the next best step—with the evidence and audit trail intact.</p>
        <div className="welcome-actions">
          <Link href="/overview" className="btn" style={{ textDecoration: 'none' }} data-testid="link-launch-demo">Launch demo <ArrowRight size={14} /></Link>
          <Link href="/customers/cust_sarah" className="btn secondary" style={{ textDecoration: 'none' }} data-testid="link-watch-ai">Watch AI in action <Sparkles size={14} /></Link>
        </div>
        <div className="muted" style={{ fontSize: 10, marginTop: 15 }}>Synthetic workspace · No account needed · Demo AI, no live model</div>
      </div>
      <div className="welcome-visual" aria-label="CXOS turns signals into human-reviewed actions">
        <div className="visual-glow" />
        <div className="visual-node node-signals"><AudioLines size={15} /><span>Customer signals</span></div>
        <div className="visual-node node-insight"><Activity size={15} /><span>Explainable insight</span></div>
        <div className="visual-node node-action"><CheckCircle2 size={15} /><span>Human-approved action</span></div>
        <div className="visual-center"><span className="brand-mark"><Activity size={21} /></span><strong>CXOS</strong><small>DEMO AI</small></div>
        <div className="visual-connector connector-one" /><div className="visual-connector connector-two" /><div className="visual-connector connector-three" />
      </div>
    </section>
    <div className="welcome-stats">
      <div><strong>50</strong><span>Synthetic customer profiles</span></div>
      <div><strong>110</strong><span>Cross-channel conversations</span></div>
      <div><strong>Human-led</strong><span>Approval before action</span></div>
      <div><strong>Auditable</strong><span>Every demo decision recorded</span></div>
    </div>
    <section className="welcome-section">
      <div><div className="eyebrow">THE PROBLEM</div><h2>Customer experience breaks between the signals.</h2><p className="muted">Support messages, reviews, and product issues each tell part of the story. Teams often discover the pattern only after repeat contact and declining trust.</p></div>
      <div className="welcome-cards">
        <article className="card card-pad"><span className="signal-icon"><Inbox size={16} /></span><h3>Disconnected context</h3><p className="muted">Bring cross-channel interactions and customer history into one view.</p></article>
        <article className="card card-pad"><span className="signal-icon"><AlertTriangle size={16} /></span><h3>Late risk signals</h3><p className="muted">Surface repeated effort, changing sentiment, and churn estimates early.</p></article>
        <article className="card card-pad"><span className="signal-icon"><ShieldCheck size={16} /></span><h3>Unclear accountability</h3><p className="muted">Keep recommendations reviewable and actions visible in the audit trail.</p></article>
      </div>
    </section>
    <section className="card card-pad welcome-loop">
      <div className="card-head"><div><div className="eyebrow">THE CXOS LOOP</div><div className="card-title">Intelligence should lead to action—and learning.</div></div><span className="tag pending">EVIDENCE → OUTCOME</span></div>
      <JourneyLoop />
    </section>
    <section className="welcome-cta">
      <div><div className="eyebrow">START WITH SARAH WILLIAMS</div><h2>Follow one real-looking story, built entirely from synthetic data.</h2><p className="muted">Review repeated delivery contacts, inspect the risk evidence, approve a rescue plan, then compare the simulated health change with its audit entry.</p></div>
      <Link href="/customers/cust_sarah" className="btn" style={{ textDecoration: 'none' }} data-testid="link-open-sarah">Open the rescue journey <ArrowRight size={14} /></Link>
    </section>
    <div className="welcome-disclosure"><ShieldCheck size={14} /> Demo environment: all records and outcomes are synthetic. Demo AI is deterministic; no message or refund is sent.</div>
  </div>;
}
function NotFound() {
  return <div className="content"><PageHead eyebrow="404 / not in this workspace" title="This route isn’t here." sub="Choose a CXOS surface from the navigation to continue." /><Link href="/overview" className="btn" style={{ textDecoration: 'none' }}><ArrowRight size={14} />Back to overview</Link></div>;
}
function Router() {
  const [location] = useLocation();
  return <AppFrame><div key={location} className="fade-in"><Switch>
    <Route path="/" component={WelcomePage} />
    <Route path="/overview" component={Dashboard} />
    <Route path="/inbox" component={InboxPage} />
    <Route path="/customers" component={CustomersPage} />
    <Route path="/customers/:customerId" component={ProfilePage} />
    <Route path="/intelligence" component={IntelligencePage} />
    <Route path="/actions" component={ActionsPage} />
    <Route path="/copilot" component={CopilotPage} />
    <Route path="/trust" component={TrustPage} />
    <Route component={NotFound} />
  </Switch></div></AppFrame>;
}
function App() {
  return <QueryClientProvider client={queryClient}><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router /></WouterRouter></QueryClientProvider>;
}

export default App;