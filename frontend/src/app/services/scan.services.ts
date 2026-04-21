import { Injectable, signal, computed } from '@angular/core';
import { ScanResult, Finding, Severity, User } from '../models/pyspector.models';

@Injectable({ providedIn: 'root' })
export class ScanService {

  readonly currentUser = signal<User>({
    id: 'usr-001', name: 'Marco Rossi',
    email: 'm.rossi@securitycert.it', role: 'Admin', avatarInitials: 'MR'
  });

  readonly activePage = signal<string>('overview');
  readonly currentScan = signal<ScanResult>(MOCK_SCAN);

  readonly summary  = computed(() => this.currentScan().summary);
  readonly findings = computed(() => this.currentScan().findings);
  readonly callGraph = computed(() => this.currentScan().callGraph);

  setPage(p: string) { this.activePage.set(p); }

  topVulnerableFiles(n = 6) {
    const order: Severity[] = ['CRITICAL','HIGH','MEDIUM','LOW','INFO'];
    const map: Record<string, { count: number; worst: Severity }> = {};
    for (const f of this.findings()) {
      if (!map[f.file]) map[f.file] = { count: 0, worst: 'INFO' };
      map[f.file].count++;
      if (order.indexOf(f.severity) < order.indexOf(map[f.file].worst))
        map[f.file].worst = f.severity;
    }
    return Object.entries(map)
      .sort((a, b) => b[1].count - a[1].count).slice(0, n)
      .map(([file, d]) => ({ file, ...d }));
  }
}

// ── Mock — in produzione arriva da `pyspector scan -f json` ──
// Carica il JSON con: this.currentScan.set(await fetch('/assets/report.json').then(r=>r.json()))
const MOCK_SCAN: ScanResult = {
  id: 'scan-20260410-1432', timestamp: new Date(), target: './myproject/',
  filesScanned: 142, linesScanned: 18420, scanDurationMs: 719, throughputLps: 25607,
  engineVersion: 'v0.1.4-beta',
  summary: { critical: 3, high: 8, medium: 12, low: 18, info: 6, total: 47,
             newSinceBaseline: 7, resolvedSinceBaseline: 12 },
  findings: [
    { id:'f001', ruleId:'SQL_INJECTION_001', title:'SQL Injection via request.GET',
      description:'Unsanitized user input flows into a raw SQL query.',
      severity:'CRITICAL', method:'Taint', file:'views/user_api.py', line:142,
      cweId:'CWE-89', owaspCategory:'SQL Injection', isBaselined:false,
      codeSnippet:'query = "SELECT * FROM users WHERE id=" + request.GET["id"]',
      taintPath:{ source:{file:'views/user_api.py',line:140,function:'get_user',label:'request.GET["id"]'},
                  sink:{file:'views/user_api.py',line:142,function:'get_user',label:'cursor.execute()'},hops:[] } },
    { id:'f002', ruleId:'EVAL_EXEC_001', title:'eval() on user-controlled input',
      description:'Arbitrary code execution: eval() called with user data.',
      severity:'CRITICAL', method:'AST', file:'core/template_engine.py', line:67,
      cweId:'CWE-95', owaspCategory:'Command Injection', isBaselined:false,
      codeSnippet:'result = eval(user_template)' },
    { id:'f003', ruleId:'HARDCODED_SECRET_001', title:'Hardcoded API key in settings',
      description:'High-entropy string matching API key pattern.',
      severity:'HIGH', method:'Regex', file:'config/settings.py', line:23,
      cweId:'CWE-798', owaspCategory:'Hardcoded Secrets', isBaselined:false,
      codeSnippet:'STRIPE_SECRET_KEY = "sk_live_4xT8mK..."' },
    { id:'f004', ruleId:'PICKLE_LOAD_001', title:'pickle.loads() without validation',
      description:'Deserializing untrusted data can lead to arbitrary code execution.',
      severity:'HIGH', method:'AST', file:'utils/cache.py', line:88,
      cweId:'CWE-502', owaspCategory:'Insecure Deserialization', isBaselined:false,
      codeSnippet:'obj = pickle.loads(redis_client.get(key))' },
    { id:'f005', ruleId:'SUBPROCESS_SHELL_001', title:'subprocess with shell=True',
      description:'shell=True enables shell injection if input is user-controlled.',
      severity:'HIGH', method:'Regex', file:'scripts/deploy.py', line:19,
      cweId:'CWE-78', owaspCategory:'Command Injection', isBaselined:false,
      codeSnippet:'subprocess.call(f"git clone {repo_url}", shell=True)' },
    { id:'f006', ruleId:'WEAK_HASH_001', title:'MD5 used for password hashing',
      description:'MD5 is cryptographically broken for password storage.',
      severity:'MEDIUM', method:'AST', file:'auth/hashers.py', line:34,
      cweId:'CWE-327', owaspCategory:'Weak Hashing', isBaselined:false,
      codeSnippet:'hashed = hashlib.md5(password.encode()).hexdigest()' },
    { id:'f007', ruleId:'PATH_TRAVERSAL_001', title:'Path traversal via filename param',
      description:'User-supplied filename used without sanitization.',
      severity:'HIGH', method:'AST+Taint', file:'views/file_manager.py', line:55,
      cweId:'CWE-22', owaspCategory:'Path Traversal', isBaselined:false,
      codeSnippet:'full_path = os.path.join(BASE_DIR, request.GET["filename"])' },
    { id:'f008', ruleId:'INSECURE_RANDOM_001', title:'Insecure random for token generation',
      description:'random.random() is not suitable for security tokens.',
      severity:'MEDIUM', method:'AST', file:'auth/tokens.py', line:18,
      cweId:'CWE-338', owaspCategory:'Insecure Randomness', isBaselined:false,
      codeSnippet:'token = str(random.random())[2:]' },
  ],
  callGraph: {
    // Questo JSON arriva direttamente dal Rust core (pyspector scan -f json)
    // Angular lo visualizza soltanto, NON lo calcola
    nodes: [
      { id:'n1', label:'handle_request',  file:'views/user_api.py',       line:130, type:'source',   severity:'CRITICAL', callCount:8,  isEntryPoint:true,  module:'views' },
      { id:'n2', label:'get_user_data',   file:'views/user_api.py',       line:138, type:'tainted',  severity:'CRITICAL', callCount:4,  isEntryPoint:false, module:'views' },
      { id:'n3', label:'cursor.execute',  file:'views/user_api.py',       line:142, type:'sink',     severity:'CRITICAL', callCount:4,  isEntryPoint:false, module:'views' },
      { id:'n4', label:'search_endpoint', file:'api/search.py',           line:25,  type:'source',   severity:'CRITICAL', callCount:12, isEntryPoint:true,  module:'api'   },
      { id:'n5', label:'build_query',     file:'api/search.py',           line:28,  type:'tainted',  severity:'HIGH',     callCount:12, isEntryPoint:false, module:'api'   },
      { id:'n6', label:'db.raw_query',    file:'api/search.py',           line:31,  type:'sink',     severity:'CRITICAL', callCount:12, isEntryPoint:false, module:'api'   },
      { id:'n7', label:'serve_file',      file:'views/file_manager.py',   line:50,  type:'source',   severity:'HIGH',     callCount:3,  isEntryPoint:true,  module:'views' },
      { id:'n8', label:'resolve_path',    file:'views/file_manager.py',   line:53,  type:'tainted',  severity:'HIGH',     callCount:3,  isEntryPoint:false, module:'views' },
      { id:'n9', label:'os.path.join',    file:'views/file_manager.py',   line:55,  type:'sink',     severity:'HIGH',     callCount:3,  isEntryPoint:false, module:'views' },
      { id:'n10',label:'render_template', file:'core/template_engine.py', line:60,  type:'function', severity:'CRITICAL', callCount:22, isEntryPoint:false, module:'core'  },
      { id:'n11',label:'eval_expression', file:'core/template_engine.py', line:67,  type:'sink',     severity:'CRITICAL', callCount:5,  isEntryPoint:false, module:'core'  },
      { id:'n12',label:'load_cache',      file:'utils/cache.py',          line:82,  type:'function', severity:'HIGH',     callCount:31, isEntryPoint:false, module:'utils' },
      { id:'n13',label:'pickle.loads',    file:'utils/cache.py',          line:88,  type:'sink',     severity:'HIGH',     callCount:6,  isEntryPoint:false, module:'utils' },
      { id:'n14',label:'generate_token',  file:'auth/tokens.py',          line:15,  type:'function', severity:'MEDIUM',   callCount:7,  isEntryPoint:false, module:'auth'  },
      { id:'n15',label:'login_view',      file:'auth/views.py',           line:190, type:'source',   severity:'MEDIUM',   callCount:9,  isEntryPoint:true,  module:'auth'  },
    ],
    edges: [
      { id:'e1', source:'n1', target:'n2',  isTainted:true,  callLine:138 },
      { id:'e2', source:'n2', target:'n3',  isTainted:true,  callLine:142, label:'SQL sink' },
      { id:'e3', source:'n4', target:'n5',  isTainted:true,  callLine:28  },
      { id:'e4', source:'n5', target:'n6',  isTainted:true,  callLine:31,  label:'SQL sink' },
      { id:'e5', source:'n7', target:'n8',  isTainted:true,  callLine:53  },
      { id:'e6', source:'n8', target:'n9',  isTainted:true,  callLine:55  },
      { id:'e7', source:'n1', target:'n10', isTainted:false, callLine:62  },
      { id:'e8', source:'n10',target:'n11', isTainted:true,  callLine:67,  label:'eval()' },
      { id:'e9', source:'n12',target:'n13', isTainted:false, callLine:88  },
      { id:'e10',source:'n15',target:'n14', isTainted:false, callLine:196 },
      { id:'e11',source:'n4', target:'n12', isTainted:false, callLine:26  },
      { id:'e12',source:'n1', target:'n12', isTainted:false, callLine:135 },
    ]
  }
};