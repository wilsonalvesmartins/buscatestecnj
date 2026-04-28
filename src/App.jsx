import React, { useState, useEffect } from 'react';
import { 
  Search, Briefcase, Calendar, Building,
  AlertCircle, Loader2, Clock, MapPin, Scale, Copy, CheckCircle2,
  ShieldCheck
} from 'lucide-react';

const API_KEY = "cDZHYzlZa0JadVREZDJCendQbXY6SkJITzNjLV9TRENyQk1RdnFKZGRQdw==";

const TRIBUNAIS = {
  "Tribunais Superiores": [
    { id: "stj", name: "STJ - Superior Tribunal de Justiça" },
    { id: "tst", name: "TST - Tribunal Superior do Trabalho" },
    { id: "tse", name: "TSE - Tribunal Superior Eleitoral" },
    { id: "stm", name: "STM - Superior Tribunal Militar" }
  ],
  "Justiça Federal": [
    { id: "trf1", name: "TRF1 - 1ª Região" }, { id: "trf2", name: "TRF2 - 2ª Região" },
    { id: "trf3", name: "TRF3 - 3ª Região" }, { id: "trf4", name: "TRF4 - 4ª Região" },
    { id: "trf5", name: "TRF5 - 5ª Região" }, { id: "trf6", name: "TRF6 - 6ª Região" }
  ],
  "Justiça do Trabalho (TRTs)": [
    { id: "trt1", name: "TRT1 - RJ" }, { id: "trt2", name: "TRT2 - SP (Capital)" },
    { id: "trt3", name: "TRT3 - MG" }, { id: "trt4", name: "TRT4 - RS" },
    { id: "trt5", name: "TRT5 - BA" }, { id: "trt6", name: "TRT6 - PE" },
    { id: "trt7", name: "TRT7 - CE" }, { id: "trt8", name: "TRT8 - PA/AP" },
    { id: "trt9", name: "TRT9 - PR" }, { id: "trt10", name: "TRT10 - DF/TO" },
    { id: "trt11", name: "TRT11 - AM/RR" }, { id: "trt12", name: "TRT12 - SC" },
    { id: "trt13", name: "TRT13 - PB" }, { id: "trt14", name: "TRT14 - RO/AC" },
    { id: "trt15", name: "TRT15 - SP (Campinas)" }, { id: "trt16", name: "TRT16 - MA" },
    { id: "trt17", name: "TRT17 - ES" }, { id: "trt18", name: "TRT18 - GO" },
    { id: "trt19", name: "TRT19 - AL" }, { id: "trt20", name: "TRT20 - SE" },
    { id: "trt21", name: "TRT21 - RN" }, { id: "trt22", name: "TRT22 - PI" },
    { id: "trt23", name: "TRT23 - MT" }, { id: "trt24", name: "TRT24 - MS" }
  ],
  "Justiça Estadual (TJs)": [
    { id: "tjac", name: "TJAC - Acre" }, { id: "tjal", name: "TJAL - Alagoas" },
    { id: "tjam", name: "TJAM - Amazonas" }, { id: "tjap", name: "TJAP - Amapá" },
    { id: "tjba", name: "TJBA - Bahia" }, { id: "tjce", name: "TJCE - Ceará" },
    { id: "tjdft", name: "TJDFT - Distrito Federal" }, { id: "tjes", name: "TJES - Espírito Santo" },
    { id: "tjgo", name: "TJGO - Goiás" }, { id: "tjma", name: "TJMA - Maranhão" },
    { id: "tjmt", name: "TJMT - Mato Grosso" }, { id: "tjms", name: "TJMS - Mato Grosso do Sul" },
    { id: "tjmg", name: "TJMG - Minas Gerais" }, { id: "tjpa", name: "TJPA - Pará" },
    { id: "tjpb", name: "TJPB - Paraíba" }, { id: "tjpr", name: "TJPR - Paraná" },
    { id: "tjpe", name: "TJPE - Pernambuco" }, { id: "tjpi", name: "TJPI - Piauí" },
    { id: "tjrj", name: "TJRJ - Rio de Janeiro" }, { id: "tjrn", name: "TJRN - Rio Grande do Norte" },
    { id: "tjrs", name: "TJRS - Rio Grande do Sul" }, { id: "tjro", name: "TJRO - Rondônia" },
    { id: "tjrr", name: "TJRR - Roraima" }, { id: "tjsc", name: "TJSC - Santa Catarina" },
    { id: "tjsp", name: "TJSP - São Paulo" }, { id: "tjse", name: "TJSE - Sergipe" },
    { id: "tjto", name: "TJTO - Tocantins" }
  ]
};

const formatProcessNumber = (p) => {
  if (!p) return "N/A";
  const num = p.replace(/\D/g, '');
  if (num.length !== 20) return p;
  return `${num.slice(0,7)}-${num.slice(7,9)}.${num.slice(9,13)}.${num.slice(13,14)}.${num.slice(14,16)}.${num.slice(16,20)}`;
};

const formatDate = (isoString) => {
  if (!isoString) return "N/A";
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch (e) { return isoString; }
};

export default function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const [tribunal, setTribunal] = useState('tjsp');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);
  const [totalHits, setTotalHits] = useState(0);
  const [copiedId, setCopiedId] = useState(null);
  const [history, setHistory] = useState(() => JSON.parse(localStorage.getItem('datajud_v3') || '[]'));

  useEffect(() => localStorage.setItem('datajud_v3', JSON.stringify(history)), [history]);

  const executeSearch = async (e) => {
    if (e) e.preventDefault();
    if (!searchTerm.trim()) return;

    setLoading(true);
    setError(null);
    setResults([]);

    const justNumbers = searchTerm.replace(/\D/g, '');
    const isProcessSearch = justNumbers.length >= 14;

    const queryBody = {
      size: 30,
      query: isProcessSearch 
        ? { match: { "numeroProcesso": justNumbers } }
        : { query_string: { query: `"${searchTerm}"`, default_field: "*", default_operator: "AND" } },
      sort: [ { "@timestamp": { order: "desc" } } ]
    };

    const finalUrl = `/api-datajud/api_publica_${tribunal}/_search`;

    try {
      const response = await fetch(finalUrl, {
        method: 'POST',
        headers: {
          'Authorization': `APIKey ${API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(queryBody)
      });

      if (!response.ok) throw new Error(`A API retornou erro ${response.status}.`);

      const data = await response.json();
      const hits = data?.hits?.hits || [];
      setResults(hits);
      setTotalHits(data?.hits?.total?.value || 0);

      const newHistory = [{ term: searchTerm, tribunal, date: new Date().toISOString() }, ...history.filter(h => h.term !== searchTerm)].slice(0, 10);
      setHistory(newHistory);
    } catch (err) {
      setError("Falha de Conexão: Verifique se o Nginx está a encaminhar os pedidos corretamente no servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex overflow-hidden">
      <aside className="w-72 bg-white border-r border-slate-200 hidden lg:flex flex-col shadow-sm">
        <div className="p-6 border-b border-slate-100 flex items-center space-x-3">
          <Scale className="w-8 h-8 text-indigo-600" />
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">Datajud<span className="text-indigo-600">Search</span></h1>
        </div>
        <div className="p-4 flex-1 overflow-y-auto">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center">
            <Clock className="w-4 h-4 mr-2" /> Histórico
          </h2>
          {history.map((h, i) => (
            <button key={i} onClick={() => { setSearchTerm(h.term); setTribunal(h.tribunal); }} className="w-full text-left bg-slate-50 p-3 rounded-xl hover:bg-indigo-50 mb-2 border border-transparent transition-all">
              <p className="text-sm font-semibold text-slate-700 truncate">{h.term}</p>
              <span className="text-[10px] text-slate-400 font-bold uppercase">{h.tribunal}</span>
            </button>
          ))}
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="bg-white border-b border-slate-200 p-6 md:p-10">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Busca Processual</h2>
                <p className="text-slate-500">Base nacional de dados do Poder Judiciário.</p>
              </div>
              <div className="hidden md:flex items-center space-x-2 text-emerald-600 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100">
                <ShieldCheck className="w-4 h-4" />
                <span className="text-xs font-bold uppercase">Ligação Segura</span>
              </div>
            </div>
            
            <form onSubmit={executeSearch} className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="OAB, Nome ou Nº Processo..." className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-inner" />
              </div>
              <select value={tribunal} onChange={(e) => setTribunal(e.target.value)} className="w-full md:w-64 py-4 px-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-600 outline-none cursor-pointer">
                {Object.entries(TRIBUNAIS).map(([cat, items]) => (
                  <optgroup key={cat} label={cat}>{items.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</optgroup>
                ))}
              </select>
              <button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl font-bold shadow-lg shadow-indigo-200 disabled:opacity-50 transition-all">
                {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Pesquisar'}
              </button>
            </form>

            {error && (
              <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 text-sm flex items-start">
                <AlertCircle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
                <div><p className="font-bold">Aviso de Ambiente</p><p>{error}</p></div>
              </div>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-slate-50/30">
          <div className="max-w-4xl mx-auto space-y-6 pb-20">
            {results.map((hit, idx) => (
              <div key={idx} className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm hover:shadow-xl transition-all duration-300 group">
                <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-mono font-black text-slate-900">{formatProcessNumber(hit._source.numeroProcesso)}</h3>
                      <button onClick={() => { navigator.clipboard.writeText(hit._source.numeroProcesso); setCopiedId(idx); setTimeout(()=>setCopiedId(null),2000); }} className="text-slate-300 hover:text-indigo-600">
                        {copiedId === idx ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                    <div className="flex gap-4 items-center">
                      <span className="flex items-center text-xs font-bold text-slate-400 uppercase tracking-wider"><Building className="w-3 h-3 mr-1" /> {hit._source.orgaoJulgador?.nome}</span>
                      <span className="flex items-center text-xs font-bold text-indigo-500 uppercase tracking-wider"><MapPin className="w-3 h-3 mr-1" /> {hit._source.tribunal}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-300 uppercase mb-1">Ajuizamento</p>
                    <p className="text-sm font-bold text-slate-600">{formatDate(hit._source.dataAjuizamento).split(',')[0]}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-slate-50">
                  <div>
                    <p className="text-[10px] font-black text-slate-300 uppercase mb-2 tracking-widest">Classe e Assunto</p>
                    <p className="text-sm font-bold text-slate-700 leading-relaxed">{hit._source.classe?.nome}</p>
                    {hit._source.assuntos?.[0] && <span className="mt-2 inline-block px-3 py-1 bg-slate-100 text-slate-500 text-[10px] font-bold rounded-full">{hit._source.assuntos[0].nome}</span>}
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-300 uppercase mb-2 tracking-widest">Último Movimento</p>
                    {hit._source.movimentos?.[0] ? (
                      <div className="bg-indigo-50/30 p-3 rounded-2xl border border-indigo-100/50">
                        <p className="text-xs font-bold text-indigo-900 line-clamp-2">{hit._source.movimentos[0].nome}</p>
                        <p className="text-[10px] text-indigo-400 mt-1 font-bold">{formatDate(hit._source.movimentos[0].dataHora)}</p>
                      </div>
                    ) : <p className="text-xs text-slate-400 italic">Sem movimentos indexados.</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
