/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useMemo } from 'react';
import { db } from './lib/firebase';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { useOficina } from './components/OficinaContext';

const COR = '#38bdf8';
const COR2 = '#0ea5e9';
const GREEN = '#00E676';
const WARN = '#f59e0b';

const normalizarPlaca = (v) => (v||'').toUpperCase().replace(/[^A-Z0-9]/g,'');
const formatarMoeda = (v) => Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const comprimirFoto = (b, q=0.5) => new Promise(res => {
  const img = new Image(); img.onload = () => {
    const c = document.createElement('canvas'), MAX=800, sc=img.width>MAX?MAX/img.width:1;
    c.width=img.width*sc; c.height=img.height*sc;
    c.getContext('2d').drawImage(img,0,0,c.width,c.height);
    res(c.toDataURL('image/jpeg',q));
  }; img.src=b;
});

const SERVICOS_AC = [
  { key: 'manutencao',      label: '🔧 Manutenção Geral',     desc: 'Verificação completa do sistema' },
  { key: 'higienizacao',    label: '🧹 Higienização',          desc: 'Limpeza interna do sistema' },
  { key: 'recarga_gas',     label: '❄️ Recarga de Gás',        desc: 'Recarga com gás R134a ou R1234yf' },
  { key: 'troca_filtro',    label: '🌀 Troca de Filtro',       desc: 'Cabine e de ar do compressor' },
  { key: 'troca_correia',   label: '⚙️ Troca de Correia',      desc: 'Correia do compressor' },
  { key: 'troca_compressor',label: '🔩 Troca de Compressor',   desc: 'Compressor danificado' },
  { key: 'troca_condensador',label:'💨 Troca de Condensador',  desc: 'Condensador com vazamento' },
  { key: 'leak_test',       label: '🔍 Teste de Vazamento',    desc: 'Localizar vazamentos no sistema' },
];

const FORM_VAZIO = {
  placa:'', nomeCliente:'', telefone:'', modelo:'',
  servicos:[], valorTotal:'', obs:'', fotos:[],
  dataUltimaRecarga:'', proximaRecarga:'', tipoGas:'R134a',
  status:'aberta',
};

const TIPOS_GAS = ['R134a','R1234yf','R12 (antigo)'];

export default function ArCondicionado({ osParaEditar, onCancelarEdicao, onSalvo, buscarPorPlaca, carregarOS }) {
  const { oficinaId } = useOficina() || {};
  const [lista, setLista] = useState([]);
  const [form, setForm] = useState(FORM_VAZIO);
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [subAba, setSubAba] = useState('novo');
  const [legendaFoto, setLegendaFoto] = useState('');
  const [autoFill, setAutoFill] = useState(false);

  useEffect(() => { carregarLista(); }, [oficinaId]);

  useEffect(() => {
    if (!osParaEditar || osParaEditar.tipoServico !== 'ar_condicionado') return;
    setForm({ ...FORM_VAZIO, ...osParaEditar });
    setEditandoId(osParaEditar.id);
    setSubAba('novo');
  }, [osParaEditar]);

  const carregarLista = async () => {
    if (!oficinaId) return;
    try {
      const snap = await getDocs(collection(db,'oficinas',oficinaId,'os'));
      setLista(snap.docs.map(d=>({id:d.id,...d.data()}))
        .filter(o=>o.tipoServico==='ar_condicionado')
        .sort((a,b)=>new Date(b.data_registro||0)-new Date(a.data_registro||0)));
    } catch(e){console.error(e);}
  };

  const buscaPlaca = (p) => {
    if (buscarPorPlaca) buscarPorPlaca(p, {
      setNome: v => setForm(prev=>({...prev, nomeCliente: prev.nomeCliente||v})),
      setTelefone: v => setForm(prev=>({...prev, telefone: prev.telefone||v})),
      setModelo: v => setForm(prev=>({...prev, modelo: prev.modelo||v})),
      onFound: () => { setAutoFill(true); setTimeout(()=>setAutoFill(false),3000); }
    });
  };

  // Lembretes: AC com recarga há mais de 365 dias
  const lembretes = useMemo(() => {
    const hoje = new Date();
    return lista.filter(o => {
      if (!o.dataUltimaRecarga) return false;
      const dt = new Date(o.dataUltimaRecarga);
      const diff = (hoje - dt) / (1000*60*60*24);
      return diff >= 335; // avisa 30 dias antes de completar 1 ano
    });
  }, [lista]);

  const salvar = async () => {
    if (!form.placa && !form.nomeCliente) return alert('⚠️ Informe Placa ou Nome!');
    if (form.servicos.length === 0) return alert('⚠️ Selecione ao menos 1 serviço!');
    setSalvando(true);
    try {
      const servicosTexto = form.servicos.map(k=>SERVICOS_AC.find(s=>s.key===k)?.label||k).join(', ');
      const dados = {
        ...form,
        placa: normalizarPlaca(form.placa),
        servicosTexto, tipoServico:'ar_condicionado',
        checklist: servicosTexto,
        valorPecas: 0,
        valorMaoObra: Number(form.valorTotal)||0,
        total: Number(form.valorTotal)||0,
        detalhesPecas: form.obs,
        data_registro: editandoId ? form.data_registro : new Date().toISOString(),
      };
      if (editandoId) {
        await updateDoc(doc(db,'oficinas',oficinaId,'os',editandoId), dados);
        if (onSalvo) onSalvo(editandoId, dados);
      } else {
        const ref = await addDoc(collection(db,'oficinas',oficinaId,'os'), dados);
        if (onSalvo) onSalvo(ref.id, dados);
      }
      setSalvo(true); setTimeout(()=>setSalvo(false),3000);
      setForm(FORM_VAZIO); setEditandoId(null);
      if (carregarOS) carregarOS();
      carregarLista();
      setSubAba('historico');
    } catch(e){ alert('Erro: '+e.message); }
    finally { setSalvando(false); }
  };

  const adicionarFoto = async (e) => {
    const f = e.target.files[0]; if(!f) return;
    const r = new FileReader();
    r.onloadend = async () => {
      const c = await comprimirFoto(r.result);
      setForm(p=>({...p, fotos:[...(p.fotos||[]),{foto:c,legenda:legendaFoto,dataEnvio:new Date().toLocaleString('pt-BR')}]}));
      setLegendaFoto('');
    };
    r.readAsDataURL(f);
  };

  const enviarWhatsApp = (item) => {
    if (!item.telefone) return alert('Sem WhatsApp!');
    const msg = `❄️ *Ar-Condicionado — ${item.nomeCliente||'Cliente'}*\n\n`+
      `🚗 ${item.modelo||'Veículo'} | Placa: *${item.placa}*\n`+
      `✅ Serviço: ${item.servicosTexto}\n`+
      (item.dataUltimaRecarga ? `📅 Última recarga: ${new Date(item.dataUltimaRecarga).toLocaleDateString('pt-BR')}\n` : '')+
      `💰 Total: *${formatarMoeda(item.valorTotal)}*\n\nServiço concluído! ✅`;
    window.open(`https://wa.me/55${item.telefone.replace(/\D/g,'')}?text=${encodeURIComponent(msg)}`,'_blank');
  };

  const totalMes = useMemo(() => {
    const mes = new Date().getMonth(); const ano = new Date().getFullYear();
    return lista.filter(o=>{
      const d=new Date(o.data_registro||0);
      return d.getMonth()===mes && d.getFullYear()===ano;
    }).reduce((acc,o)=>acc+Number(o.valorTotal||0),0);
  },[lista]);

  // ═══════════════════════ RENDER ═══════════════════════
  return (
    <div style={{color:'white',fontFamily:'sans-serif'}}>

      {/* Toast */}
      {autoFill && (
        <div style={{position:'fixed',bottom:'80px',left:'50%',transform:'translateX(-50%)',background:GREEN,color:'black',padding:'12px 24px',borderRadius:'30px',fontWeight:'900',fontSize:'13px',zIndex:9999,boxShadow:`0 4px 20px ${GREEN}66`,whiteSpace:'nowrap'}}>
          ✅ Cliente encontrado! Dados preenchidos.
        </div>
      )}

      {/* Header */}
      <div style={{background:`linear-gradient(135deg,${COR}22,transparent)`,border:`1px solid ${COR}44`,borderRadius:'14px',padding:'20px',marginBottom:'20px',display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:'12px'}}>
        <div>
          <h2 style={{margin:0,color:COR,fontSize:'22px',fontWeight:'900'}}>❄️ Ar-Condicionado</h2>
          <p style={{margin:'4px 0 0',color:'#666',fontSize:'13px'}}>Manutenção, higienização, recarga de gás e lembretes automáticos</p>
        </div>
        <div style={{display:'flex',gap:'10px',flexWrap:'wrap'}}>
          {[
            {label:'📋 O.S. no mês', val:lista.filter(o=>{const d=new Date(o.data_registro||0);return d.getMonth()===new Date().getMonth()}).length, cor:COR},
            {label:'💰 Receita mês', val:formatarMoeda(totalMes), cor:GREEN},
            {label:'🔔 Lembretes', val:lembretes.length, cor:WARN},
          ].map((s,i)=>(
            <div key={i} style={{background:'#111',border:`1px solid ${s.cor}33`,borderRadius:'10px',padding:'10px 16px',textAlign:'center',minWidth:'80px'}}>
              <p style={{margin:0,color:s.cor,fontWeight:'900',fontSize:'18px'}}>{s.val}</p>
              <p style={{margin:'2px 0 0',color:'#666',fontSize:'10px'}}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Lembretes banner */}
      {lembretes.length > 0 && (
        <div style={{background:'#1a0f00',border:`1px solid ${WARN}`,borderRadius:'12px',padding:'14px',marginBottom:'16px'}}>
          <p style={{color:WARN,fontWeight:'bold',margin:'0 0 10px',fontSize:'13px'}}>🔔 {lembretes.length} cliente(s) com recarga de gás vencendo em breve:</p>
          {lembretes.map(item=>(
            <div key={item.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 0',borderBottom:'1px solid #333'}}>
              <span style={{color:'white',fontSize:'12px'}}>{item.placa} · {item.nomeCliente} · {item.modelo}</span>
              {item.telefone && (
                <button onClick={()=>enviarWhatsApp(item)} style={{padding:'6px 12px',background:'#25D36622',color:'#25D366',border:'1px solid #25D366',borderRadius:'8px',fontSize:'11px',fontWeight:'bold',cursor:'pointer'}}>
                  💬 Avisar
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Sub-abas */}
      <div style={{display:'flex',gap:'8px',marginBottom:'20px',flexWrap:'wrap'}}>
        {[
          {key:'novo', label: editandoId ? '✏️ Editando' : '➕ Novo Serviço'},
          {key:'historico', label:`📋 Histórico (${lista.length})`},
        ].map(s=>(
          <button key={s.key} onClick={()=>{setSubAba(s.key);if(s.key!=='novo'){setForm(FORM_VAZIO);setEditandoId(null);if(onCancelarEdicao)onCancelarEdicao();}}}
            style={{padding:'10px 20px',background:subAba===s.key?COR:'#1a1a1a',color:subAba===s.key?'black':'#888',border:`1px solid ${subAba===s.key?COR:'#333'}`,borderRadius:'20px',fontWeight:'bold',fontSize:'13px',cursor:'pointer'}}>
            {s.label}
          </button>
        ))}
      </div>

      {/* ── NOVO SERVIÇO ── */}
      {subAba === 'novo' && (
        <div>
          {editandoId && (
            <div style={{background:'#001a1f',border:`2px solid ${COR}`,borderRadius:'10px',padding:'12px 16px',marginBottom:'16px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <span style={{color:COR,fontWeight:'bold',fontSize:'13px'}}>✏️ EDITANDO — {form.placa||form.nomeCliente}</span>
              <button onClick={()=>{setForm(FORM_VAZIO);setEditandoId(null);if(onCancelarEdicao)onCancelarEdicao();}} style={{background:'transparent',color:'#888',border:'1px solid #444',padding:'5px 12px',borderRadius:'5px',cursor:'pointer',fontSize:'12px'}}>✕ Cancelar</button>
            </div>
          )}

          {/* Dados cliente */}
          <div style={{background:'#111',padding:'16px',borderRadius:'12px',marginBottom:'14px'}}>
            <label style={{color:COR,fontSize:'11px',fontWeight:'bold',display:'block',marginBottom:'12px',letterSpacing:'1px'}}>👤 DADOS DO CLIENTE</label>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
              {[
                {key:'placa', ph:'PLACA', fn: v=>{const p=normalizarPlaca(v);buscaPlaca(p);return p;}},
                {key:'nomeCliente', ph:'NOME'},
                {key:'telefone', ph:'WHATSAPP', type:'tel'},
                {key:'modelo', ph:'MODELO'},
              ].map(({key,ph,fn,type})=>(
                <input key={key} type={type||'text'} value={form[key]} placeholder={ph}
                  onChange={e=>setForm(p=>({...p,[key]:fn?fn(e.target.value):e.target.value}))}
                  style={{padding:'12px',background:'#0a0a0a',border:`1px solid ${key==='placa'?COR+'55':'#333'}`,color:key==='placa'?COR:'white',borderRadius:'8px',boxSizing:'border-box',width:'100%',fontWeight:key==='placa'?'bold':'normal'}} />
              ))}
            </div>
          </div>

          {/* Tipo de gás */}
          <div style={{background:'#111',padding:'14px',borderRadius:'12px',marginBottom:'14px'}}>
            <label style={{color:'#666',fontSize:'10px',fontWeight:'bold',display:'block',marginBottom:'8px'}}>🧪 TIPO DE GÁS</label>
            <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
              {TIPOS_GAS.map(g=>(
                <button key={g} onClick={()=>setForm(p=>({...p,tipoGas:g}))}
                  style={{padding:'8px 16px',background:form.tipoGas===g?COR+'22':'#0a0a0a',color:form.tipoGas===g?COR:'#666',border:`1px solid ${form.tipoGas===g?COR:'#333'}`,borderRadius:'20px',fontWeight:'bold',fontSize:'12px',cursor:'pointer'}}>
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Serviços */}
          <div style={{background:'#111',padding:'16px',borderRadius:'12px',marginBottom:'14px'}}>
            <label style={{color:COR,fontSize:'11px',fontWeight:'bold',display:'block',marginBottom:'14px',letterSpacing:'1px'}}>🔧 SERVIÇOS</label>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
              {SERVICOS_AC.map(s=>{
                const ativo=form.servicos.includes(s.key);
                return (
                  <button key={s.key} onClick={()=>setForm(p=>({...p,servicos:ativo?p.servicos.filter(k=>k!==s.key):[...p.servicos,s.key]}))}
                    style={{padding:'12px 10px',background:ativo?COR+'22':'#0a0a0a',border:`2px solid ${ativo?COR:'#333'}`,color:ativo?COR:'#666',borderRadius:'10px',fontWeight:'bold',cursor:'pointer',textAlign:'left',fontSize:'12px'}}>
                    <span style={{display:'block'}}>{ativo?'✅ ':''}{s.label}</span>
                    <span style={{color:ativo?COR+'aa':'#444',fontSize:'10px',fontWeight:'normal'}}>{s.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Data última recarga */}
          {(form.servicos.includes('recarga_gas') || form.dataUltimaRecarga) && (
            <div style={{background:'#111',padding:'14px',borderRadius:'12px',marginBottom:'14px'}}>
              <label style={{color:COR,fontSize:'10px',fontWeight:'bold',display:'block',marginBottom:'8px'}}>📅 DATA DA RECARGA (para lembrete automático em 1 ano)</label>
              <input type="date" value={form.dataUltimaRecarga}
                onChange={e=>setForm(p=>({...p,dataUltimaRecarga:e.target.value}))}
                style={{width:'100%',padding:'12px',background:'#0a0a0a',border:`1px solid ${COR}44`,color:COR,borderRadius:'8px',colorScheme:'dark',boxSizing:'border-box'}} />
              {!form.dataUltimaRecarga && (
                <button onClick={()=>setForm(p=>({...p,dataUltimaRecarga:new Date().toISOString().split('T')[0]}))}
                  style={{marginTop:'8px',padding:'8px 16px',background:COR+'22',color:COR,border:`1px solid ${COR}`,borderRadius:'8px',fontSize:'12px',fontWeight:'bold',cursor:'pointer'}}>
                  📅 Hoje
                </button>
              )}
            </div>
          )}

          {/* Valor */}
          <div style={{background:'#111',padding:'14px',borderRadius:'12px',marginBottom:'14px'}}>
            <label style={{color:'#666',fontSize:'10px',fontWeight:'bold',display:'block',marginBottom:'8px'}}>💰 VALOR TOTAL (R$)</label>
            <input type="number" value={form.valorTotal} placeholder="0,00"
              onChange={e=>setForm(p=>({...p,valorTotal:e.target.value}))}
              style={{width:'100%',padding:'14px',background:'#0a0a0a',border:`1px solid ${GREEN}44`,color:GREEN,borderRadius:'8px',fontSize:'24px',fontWeight:'900',textAlign:'center',boxSizing:'border-box'}} />
          </div>

          {/* Obs */}
          <div style={{background:'#111',padding:'14px',borderRadius:'12px',marginBottom:'14px'}}>
            <label style={{color:'#666',fontSize:'10px',fontWeight:'bold',display:'block',marginBottom:'8px'}}>📝 OBSERVAÇÕES</label>
            <textarea value={form.obs} onChange={e=>setForm(p=>({...p,obs:e.target.value}))}
              rows={3} placeholder="Ex: compressor com barulho, filtro entupido, gás com vazamento..."
              style={{width:'100%',padding:'12px',background:'#0a0a0a',border:'1px solid #333',color:'white',borderRadius:'8px',resize:'vertical',boxSizing:'border-box',fontSize:'13px'}} />
          </div>

          {/* Fotos */}
          <div style={{background:'#111',padding:'14px',borderRadius:'12px',marginBottom:'20px'}}>
            <label style={{color:'#666',fontSize:'10px',fontWeight:'bold',display:'block',marginBottom:'10px'}}>📸 FOTOS ({(form.fotos||[]).length}/10)</label>
            <input value={legendaFoto} onChange={e=>setLegendaFoto(e.target.value)} placeholder="Legenda..."
              style={{width:'100%',padding:'10px',background:'#0a0a0a',border:'1px solid #333',color:'white',borderRadius:'8px',marginBottom:'8px',boxSizing:'border-box'}} />
            <label style={{display:'block',padding:'12px',background:(form.fotos||[]).length>=10?'#222':'#001a1f',border:`1px dashed ${(form.fotos||[]).length>=10?'#444':COR}`,borderRadius:'8px',textAlign:'center',cursor:(form.fotos||[]).length>=10?'not-allowed':'pointer',color:(form.fotos||[]).length>=10?'#555':'white',fontWeight:'bold'}}>
              📷 {(form.fotos||[]).length>=10?'LIMITE':'TIRAR FOTO'}
              <input type="file" accept="image/*" capture="environment" disabled={(form.fotos||[]).length>=10} onChange={adicionarFoto} style={{display:'none'}} />
            </label>
            {(form.fotos||[]).length>0 && (
              <div style={{display:'flex',gap:'8px',flexWrap:'wrap',marginTop:'10px'}}>
                {form.fotos.map((f,i)=>(
                  <div key={i} style={{position:'relative',width:'80px',borderRadius:'8px',overflow:'hidden',border:'1px solid #333'}}>
                    <img src={f.foto} alt={f.legenda} style={{width:'80px',height:'80px',objectFit:'cover'}} />
                    <div style={{background:'rgba(0,0,0,0.85)',color:'#aaa',fontSize:'9px',padding:'3px',textAlign:'center'}}>{f.legenda||'Foto'}</div>
                    <button onClick={()=>setForm(p=>({...p,fotos:p.fotos.filter((_,idx)=>idx!==i)}))} style={{position:'absolute',top:'2px',right:'2px',background:'red',color:'white',border:'none',borderRadius:'50%',width:'18px',height:'18px',cursor:'pointer',fontSize:'11px',lineHeight:'18px'}}>×</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button onClick={salvar} disabled={salvando}
            style={{width:'100%',padding:'20px',background:salvando?'#333':COR,color:'black',border:'none',borderRadius:'10px',fontSize:'18px',fontWeight:'900',cursor:'pointer'}}>
            {salvando?'⏳ SALVANDO...':salvo?'✅ SALVO!':editandoId?'💾 SALVAR EDIÇÃO':'❄️ SALVAR SERVIÇO NA O.S.'}
          </button>
        </div>
      )}

      {/* ── HISTÓRICO ── */}
      {subAba === 'historico' && (
        <div>
          {lista.length === 0 ? (
            <div style={{background:'#111',border:'1px dashed #333',borderRadius:'14px',padding:'50px',textAlign:'center'}}>
              <p style={{fontSize:'40px',margin:'0 0 10px'}}>❄️</p>
              <p style={{color:'#555',margin:0}}>Nenhum serviço de AC registrado ainda.</p>
            </div>
          ) : (
            <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
              {lista.map(item=>(
                <div key={item.id} style={{background:'#111',border:`1px solid ${COR}22`,borderRadius:'12px',padding:'14px'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:'8px',marginBottom:'8px'}}>
                    <div>
                      <p style={{margin:'0 0 2px',fontWeight:'bold',fontSize:'14px'}}>{item.nomeCliente||'Cliente'}</p>
                      <p style={{margin:'0 0 2px',color:COR,fontWeight:'900',fontSize:'16px'}}>{item.placa}</p>
                      <p style={{margin:'0 0 4px',color:'#666',fontSize:'11px'}}>{item.modelo}</p>
                      <p style={{margin:0,color:'#555',fontSize:'11px'}}>{item.servicosTexto}</p>
                      {item.dataUltimaRecarga && (
                        <p style={{margin:'4px 0 0',color:WARN,fontSize:'11px'}}>
                          ❄️ Recarga: {new Date(item.dataUltimaRecarga+'T12:00').toLocaleDateString('pt-BR')} · Gás: {item.tipoGas}
                        </p>
                      )}
                      {item.data_registro && (
                        <p style={{margin:'2px 0 0',color:'#444',fontSize:'10px'}}>📅 {new Date(item.data_registro).toLocaleDateString('pt-BR')}</p>
                      )}
                    </div>
                    <p style={{margin:0,color:GREEN,fontWeight:'900',fontSize:'18px'}}>{formatarMoeda(item.valorTotal)}</p>
                  </div>
                  <div style={{display:'flex',gap:'6px',flexWrap:'wrap'}}>
                    <button onClick={()=>{setForm({...FORM_VAZIO,...item});setEditandoId(item.id);setSubAba('novo');}}
                      style={{padding:'7px 12px',background:'#1a1a1a',color:'#888',border:'1px solid #444',borderRadius:'8px',fontSize:'11px',cursor:'pointer'}}>✏️ Editar</button>
                    {item.telefone && (
                      <button onClick={()=>enviarWhatsApp(item)}
                        style={{padding:'7px 12px',background:'#25D36622',color:'#25D366',border:'1px solid #25D366',borderRadius:'8px',fontSize:'11px',fontWeight:'bold',cursor:'pointer'}}>💬 WhatsApp</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
