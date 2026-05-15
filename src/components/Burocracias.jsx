import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc, getDocs, setDoc, doc, getDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { 
  ShieldAlert, 
  ShieldCheck, 
  FileText, 
  Truck, 
  ClipboardCheck, 
  Plus, 
  Trash2, 
  Save, 
  UploadCloud, 
  Check, 
  AlertTriangle,
  FileSpreadsheet,
  Calendar,
  CheckCircle2,
  Droplets,
  Flame,
  Sprout,
  Bug,
  Sparkles
} from 'lucide-react';
import { jsPDF } from 'jspdf';

export default function Burocracias({ oficinaId }) {
    // Layout e Navegação
    const [abaInterna, setAbaInterna] = useState('alvaras'); // alvaras | descartes | checklist
    const [carregando, setCarregando] = useState(true);
    const [msgSucesso, setMsgSucesso] = useState(null);
    const [nomeOficina, setNomeOficina] = useState('Nossa Oficina');

    // -- ESTADOS DO ASSISTENTE DE CONFIGURAÇÃO --
    const [mostrarAssistente, setMostrarAssistente] = useState(false);
    const [passoAssistente, setPassoAssistente] = useState(1);

    // -- ESTADOS DE DADOS --
    
    // 1. Alvarás e Licenças
    const [alvaras, setAlvaras] = useState({
        funcionamento: { dataVencimento: '', anexo: '', nome: 'Alvará de Funcionamento (Prefeitura)' },
        avcb: { dataVencimento: '', anexo: '', nome: 'AVCB (Corpo de Bombeiros)' },
        ambiental: { dataVencimento: '', status: 'Ativo', anexo: '', nome: 'Licença Ambiental / PGRS' },
        dedetizacao: { dataVencimento: '', anexo: '', nome: 'Certificado de Dedetização' }
    });

    // 2. Registro de Descartes (Logística)
    const [descartes, setDescartes] = useState([]);
    const [novoDescarte, setNovoDescarte] = useState({
        tipoResiduo: 'Óleo Lubrificante',
        coletora: '',
        manifesto: '',
        dataColeta: new Date().toISOString().split('T')[0],
        fotoCertificado: ''
    });
    const [salvandoDescarte, setSalvandoDescarte] = useState(false);

    // 3. Checklist de Vigilância
    const [checklist, setChecklist] = useState({
        saoUltimaLimpeza: '',
        pneusCobertos: false,
        oleoContido: false
    });
    const [salvandoChecklist, setSalvandoChecklist] = useState(false);

    // -- CARREGAMENTO DE DADOS DO FIRESTORE --
    const carregarDados = async () => {
        if (!oficinaId) return;
        setCarregando(true);
        try {
            // A. Carregar Alvarás
            const alvarasRef = doc(db, 'oficinas', oficinaId, 'burocracias', 'alvaras');
            const alvarasSnap = await getDoc(alvarasRef);
            if (alvarasSnap.exists()) {
                setAlvaras(prev => ({
                    ...prev,
                    ...alvarasSnap.data()
                }));
            }

            // B. Carregar Descartes
            const descartesRef = collection(db, 'oficinas', oficinaId, 'descartes');
            const q = query(descartesRef, orderBy('dataRegistro', 'desc'));
            const descartesSnap = await getDocs(q);
            setDescartes(descartesSnap.docs.map(d => ({ id: d.id, ...d.data() })));

            // C. Carregar Checklist
            const checklistRef = doc(db, 'oficinas', oficinaId, 'burocracias', 'checklist');
            const checklistSnap = await getDoc(checklistRef);
            if (checklistSnap.exists()) {
                setChecklist(prev => ({
                    ...prev,
                    ...checklistSnap.data()
                }));
            }

            // D. Carregar Nome da Oficina para o Selo de Autoridade
            const ofiSnap = await getDoc(doc(db, 'oficinas', oficinaId));
            if (ofiSnap.exists()) {
                setNomeOficina(ofiSnap.data().nomeOficina || 'Nossa Oficina');
            }
        } catch (error) {
            console.error("Erro ao carregar dados de conformidade:", error);
        } finally {
            setCarregando(false);
        }
    };

    useEffect(() => {
        carregarDados();

        // Acionar Assistente de Configuração no Primeiro Acesso
        if (oficinaId) {
            const visto = localStorage.getItem(`assistenteConformidadeVisto_${oficinaId}`);
            if (!visto) {
                setMostrarAssistente(true);
            }
        }
    }, [oficinaId]);

    const concluirAssistente = () => {
        if (oficinaId) {
            localStorage.setItem(`assistenteConformidadeVisto_${oficinaId}`, 'true');
        }
        setMostrarAssistente(false);
    };

    // -- UTILITÁRIOS --
    
    // Compressor de Imagem Base64
    const comprimirFoto = (base64, qualidade = 0.4) => {
        return new Promise((resolve) => {
            const img = new Image();
            img.src = base64;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                // Diminuir tamanho máximo para evitar estourar tamanho de doc no firestore
                const maxW = 800;
                const maxH = 600;
                let w = img.width;
                let h = img.height;
                if (w > maxW || h > maxH) {
                    if (w > h) {
                        h = Math.round((h * maxW) / w);
                        w = maxW;
                    } else {
                        w = Math.round((w * maxH) / h);
                        h = maxH;
                    }
                }
                canvas.width = w;
                canvas.height = h;
                ctx.drawImage(img, 0, 0, w, h);
                resolve(canvas.toDataURL('image/jpeg', qualidade));
            };
        });
    };

    const processarArquivo = (e, callback) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async () => {
            const base64Compressed = await comprimirFoto(reader.result, 0.4);
            callback(base64Compressed);
        };
        reader.readAsDataURL(file);
    };

    // -- OPERAÇÕES DO BANCO DE DADOS --

    // Salvar Alvarás
    const handleSalvarAlvaras = async () => {
        try {
            const alvarasRef = doc(db, 'oficinas', oficinaId, 'burocracias', 'alvaras');
            await setDoc(alvarasRef, alvaras);
            alert('🛡️ Documentação de Alvarás e Licenças atualizada com sucesso!');
        } catch (error) {
            alert('Erro ao salvar: ' + error.message);
        }
    };

    // Atualizar um campo de Alvará no estado
    const setCampoAlvara = (chave, campo, valor) => {
        setAlvaras(prev => ({
            ...prev,
            [chave]: {
                ...prev[chave],
                [campo]: valor
            }
        }));
    };

    // Salvar Novo Registro de Descarte
    const handleSalvarDescarte = async () => {
        if (!novoDescarte.coletora.trim()) return alert('Digite o nome da Empresa Coletora');
        if (!novoDescarte.dataColeta) return alert('Selecione a data da coleta');
        
        setSalvandoDescarte(true);
        try {
            const descartesRef = collection(db, 'oficinas', oficinaId, 'descartes');
            await addDoc(descartesRef, {
                ...novoDescarte,
                dataRegistro: new Date().toISOString()
            });
            
            // Toast de Oficina Sustentável
            setMsgSucesso('🌱 Registro salvo! Sua oficina demonstra compromisso ecológico. Oficina Sustentável!');
            setTimeout(() => setMsgSucesso(null), 5000);

            // Reset Form
            setNovoDescarte({
                tipoResiduo: 'Óleo Lubrificante',
                coletora: '',
                manifesto: '',
                dataColeta: new Date().toISOString().split('T')[0],
                fotoCertificado: ''
            });
            
            // Recarregar Descartes
            const q = query(descartesRef, orderBy('dataRegistro', 'desc'));
            const dSnap = await getDocs(q);
            setDescartes(dSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (error) {
            alert('Erro ao salvar descarte: ' + error.message);
        } finally {
            setSalvandoDescarte(false);
        }
    };

    // Deletar Registro de Descarte
    const handleDeletarDescarte = async (id) => {
        if (!window.confirm('Deseja excluir permanentemente este registro de coleta?')) return;
        try {
            await deleteDoc(doc(db, 'oficinas', oficinaId, 'descartes', id));
            setDescartes(prev => prev.filter(d => d.id !== id));
        } catch (error) {
            alert('Erro ao deletar: ' + error.message);
        }
    };

    // Salvar Checklist
    const handleSalvarChecklist = async () => {
        setSalvandoChecklist(true);
        try {
            const checklistRef = doc(db, 'oficinas', oficinaId, 'burocracias', 'checklist');
            await setDoc(checklistRef, {
                ...checklist,
                dataAtualizacao: new Date().toISOString()
            });
            alert('✅ Checklist de Operação & Vigilância salvo com sucesso!');
        } catch (error) {
            alert('Erro ao salvar checklist: ' + error.message);
        } finally {
            setSalvandoChecklist(false);
        }
    };

    // -- LÓGICA DE CÁLCULOS DOS CARDS SUPERIORES --

    // 1. Status de Documentação
    const statusDocumentacao = useMemo(() => {
        let vencido = false;
        let atencao = false;
        const hoje = new Date();
        const trintaDias = new Date();
        trintaDias.setDate(hoje.getDate() + 30);

        Object.values(alvaras).forEach(doc => {
            if (doc.dataVencimento) {
                const dtVenc = new Date(doc.dataVencimento);
                if (dtVenc < hoje) {
                    vencido = true;
                } else if (dtVenc <= trintaDias) {
                    atencao = true;
                }
            } else {
                // Se não preencheu data, opcionalmente podemos alertar, mas manteremos neutro por enquanto.
            }
        });

        if (vencido) return { label: 'Vencido', cor: 'rose', msg: 'Atenção! Há documentos vencidos.', icone: <ShieldAlert size={24} className="text-rose-400" /> };
        if (atencao) return { label: 'Atenção', cor: 'amber', msg: 'Documentos vencendo em < 30 dias.', icone: <AlertTriangle size={24} className="text-amber-400" /> };
        return { label: 'Em dia', cor: 'emerald', msg: 'Tudo seguro juridicamente.', icone: <ShieldCheck size={24} className="text-emerald-400" /> };
    }, [alvaras]);

    // 2. Próximo Descarte (120 dias da última limpeza SAO)
    const calculoSao = useMemo(() => {
        if (!checklist.saoUltimaLimpeza) return { dataLabel: 'Não registrado', diasRestantes: null, urgente: false };
        const ultimaData = new Date(checklist.saoUltimaLimpeza);
        const proxData = new Date(ultimaData);
        proxData.setDate(proxData.getDate() + 120);
        
        const hoje = new Date();
        const diffTime = proxData.getTime() - hoje.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return {
            dataLabel: proxData.toLocaleDateString('pt-BR'),
            diasRestantes: diffDays,
            urgente: diffDays <= 15
        };
    }, [checklist.saoUltimaLimpeza]);

    // 3. Regra de Ativação do Selo Gamificado
    const infoSelo = useMemo(() => {
        const hoje = new Date();
        hoje.setHours(0,0,0,0);

        // A. Alvará Funcionamento Válido
        const dtAlvara = alvaras.funcionamento?.dataVencimento;
        const alvaraValido = dtAlvara && new Date(dtAlvara + 'T00:00:00') >= hoje;

        // B. Óleo nos Últimos 90 dias
        const noventaDiasAtras = new Date();
        noventaDiasAtras.setDate(hoje.getDate() - 90);
        const temOleoRecente = descartes.some(d => 
            d.tipoResiduo === 'Óleo Lubrificante' && 
            d.dataColeta && 
            new Date(d.dataColeta + 'T00:00:00') >= noventaDiasAtras
        );

        // C. SAO < 120 dias
        const centoEVinteDiasAtras = new Date();
        centoEVinteDiasAtras.setDate(hoje.getDate() - 120);
        const saoEmDia = checklist.saoUltimaLimpeza && 
            new Date(checklist.saoUltimaLimpeza + 'T00:00:00') >= centoEVinteDiasAtras;

        // D. Sucata Metálica nos Últimos 180 dias (Lei do Desmanche 12.977/14)
        const centoEOitentaDiasAtras = new Date();
        centoEOitentaDiasAtras.setDate(hoje.getDate() - 180);
        const temSucataRecente = descartes.some(d => 
            (d.tipoResiduo === 'Sucata Metálica' || d.tipoResiduo === 'Sucata de Lataria') && 
            d.dataColeta && 
            new Date(d.dataColeta + 'T00:00:00') >= centoEOitentaDiasAtras
        );

        const pendencias = [];
        if (!alvaraValido) pendencias.push("Alvará de Funcionamento vencido ou ausente");
        if (!temOleoRecente) pendencias.push("Sem coleta de Óleo registrada nos últimos 90 dias");
        if (!saoEmDia) pendencias.push("Limpeza Caixa SAO atrasada (> 120 dias) ou sem data");
        if (!temSucataRecente) pendencias.push("Sem descarte de Sucata Metálica registrado nos últimos 180 dias");

        return {
            ativo: alvaraValido && temOleoRecente && saoEmDia && temSucataRecente,
            pendencias
        };
    }, [alvaras, descartes, checklist]);

    // CANVAS DRAWERS - EXPORTADORES GRÁFICOS NATIVOS
    
    // A. Instagram Card (1080x1080)
    const gerarCardInstagram = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 1080;
        canvas.height = 1080;
        const ctx = canvas.getContext('2d');

        // Fundo Degradê Ultra Premium Dark Slate
        const grd = ctx.createRadialGradient(540, 540, 50, 540, 540, 750);
        grd.addColorStop(0, '#061c14');
        grd.addColorStop(1, '#020617');
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, 1080, 1080);

        // Brilho Neon Verde nos Cantos
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 12;
        ctx.shadowBlur = 35;
        ctx.shadowColor = '#10b981';
        ctx.strokeRect(45, 45, 990, 990);
        ctx.shadowBlur = 0;

        // Linha pontilhada dourada interna
        ctx.strokeStyle = '#ca8a04';
        ctx.lineWidth = 3;
        ctx.setLineDash([15, 12]);
        ctx.strokeRect(65, 65, 950, 950);
        ctx.setLineDash([]);

        // Escudo Principal em Vetor Canvas
        ctx.shadowBlur = 50;
        ctx.shadowColor = '#10b981';
        ctx.fillStyle = 'rgba(16,185,129,0.08)';
        ctx.beginPath();
        ctx.moveTo(540, 180);
        ctx.bezierCurveTo(650, 180, 720, 240, 720, 240);
        ctx.lineTo(720, 460);
        ctx.bezierCurveTo(720, 620, 540, 750, 540, 750);
        ctx.bezierCurveTo(540, 750, 360, 620, 360, 460);
        ctx.lineTo(360, 240);
        ctx.bezierCurveTo(360, 240, 430, 180, 540, 180);
        ctx.fill();
        ctx.lineWidth = 8;
        ctx.strokeStyle = '#10b981';
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Desenha Checkmark gigante no escudo
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#fff';
        ctx.lineWidth = 22;
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#fff';
        ctx.beginPath();
        ctx.moveTo(460, 440);
        ctx.lineTo(525, 515);
        ctx.lineTo(635, 365);
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Estrelas do Topo
        ctx.fillStyle = '#eab308';
        const drawStar = (cx, cy, spikes, rOuter, rInner) => {
            let rot = Math.PI / 2 * 3;
            let x = cx, y = cy;
            let step = Math.PI / spikes;
            ctx.beginPath();
            ctx.moveTo(cx, cy - rOuter);
            for(let i=0; i<spikes; i++){
                x = cx + Math.cos(rot) * rOuter;
                y = cy + Math.sin(rot) * rOuter;
                ctx.lineTo(x, y);
                rot += step;
                x = cx + Math.cos(rot) * rInner;
                y = cy + Math.sin(rot) * rInner;
                ctx.lineTo(x, y);
                rot += step;
            }
            ctx.lineTo(cx, cy - rOuter);
            ctx.closePath();
            ctx.fill();
        };
        drawStar(540, 130, 5, 25, 12);
        drawStar(460, 145, 5, 18, 9);
        drawStar(620, 145, 5, 18, 9);

        // Textos do Card
        ctx.textAlign = 'center';
        
        // Linha 1
        ctx.fillStyle = '#fff';
        ctx.font = '900 68px sans-serif';
        ctx.fillText('OFICINA BLINDADA', 540, 840);

        // Linha 2
        ctx.fillStyle = '#10b981';
        ctx.font = 'bold 26px sans-serif';
        ctx.fillText('100% LEGALIZADA & SUSTENTÁVEL', 540, 885);

        // Mensagem central
        ctx.fillStyle = '#94a3b8';
        ctx.font = '600 32px sans-serif';
        ctx.fillText('Segurança para você e para o nosso planeta!', 540, 940);

        // Nome da Oficina
        ctx.fillStyle = '#eab308';
        ctx.font = '900 44px sans-serif';
        ctx.fillText(nomeOficina.toUpperCase(), 540, 1005);

        // Download Trigger
        const link = document.createElement('a');
        link.download = `selo_instagram_${nomeOficina.toLowerCase().replace(/[^a-z0-9]/g, '_')}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    };

    // B. Certificado A4 de Parede (1200x848)
    const gerarCertificadoPDF = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 1200;
        canvas.height = 848;
        const ctx = canvas.getContext('2d');

        // Fundo Degradê Imperial luxo (Verde Profundo / Dourado Escuro)
        const grd = ctx.createRadialGradient(600, 424, 50, 600, 424, 850);
        grd.addColorStop(0, '#022c22'); // emerald-950
        grd.addColorStop(1, '#020617'); // slate-950
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, 1200, 848);

        // Molduras Vitorianas Douradas
        ctx.strokeStyle = '#ca8a04';
        ctx.lineWidth = 22;
        ctx.strokeRect(45, 45, 1110, 758);

        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 4;
        ctx.strokeRect(70, 70, 1060, 708);

        // Detalhes Cantos
        ctx.fillStyle = '#facc15';
        const drawCorner = (x, y, r) => {
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();
        };
        drawCorner(70, 70, 8); drawCorner(1130, 70, 8);
        drawCorner(70, 778, 8); drawCorner(1130, 778, 8);

        // Textos Formais
        ctx.textAlign = 'center';
        ctx.fillStyle = '#eab308';
        ctx.font = 'italic 32px Georgia, serif';
        ctx.fillText('Certificado de Excelência & Conformidade', 600, 180);

        ctx.fillStyle = '#fff';
        ctx.font = '900 66px sans-serif';
        ctx.fillText('OFICINA BLINDADA', 600, 270);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '300 24px sans-serif';
        ctx.fillText('Certificamos publicamente que o estabelecimento comercial', 600, 370);

        // Nome da Oficina Gigante
        ctx.fillStyle = '#facc15';
        ctx.font = '900 54px sans-serif';
        ctx.shadowBlur = 15;
        ctx.shadowColor = 'rgba(250, 204, 21, 0.3)';
        ctx.fillText(nomeOficina.toUpperCase(), 600, 455);
        ctx.shadowBlur = 0;

        // Corpo Jurídico
        ctx.fillStyle = '#cbd5e1';
        ctx.font = '21px sans-serif';
        ctx.fillText('opera em plena e rigorosa conformidade com as exigências ambientais e sanitárias vigentes,', 600, 530);
        ctx.fillText('assegurando o descarte correto de poluentes perigosos (Resolução CONAMA 362/05) e', 600, 565);
        ctx.fillText('cumprindo a agenda de higienização da Caixa Separadora de Água e Óleo.', 600, 600);

        // Carimbo Oficial Dourado (Roseta)
        ctx.fillStyle = '#eab308';
        ctx.beginPath();
        const cx = 600, cy = 710, rOuter = 55, rInner = 45, points = 36;
        for(let i=0; i<points*2; i++){
            let r = i%2===0 ? rOuter : rInner;
            let angle = (Math.PI / points) * i;
            ctx.lineTo(cx + Math.cos(angle)*r, cy + Math.sin(angle)*r);
        }
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#000';
        ctx.font = '900 10px sans-serif';
        ctx.fillText('ESTABELECIMENTO', 600, 706);
        ctx.font = '900 12px sans-serif';
        ctx.fillText('100% SEGURO', 600, 722);

        // Rodapé
        ctx.fillStyle = '#475569';
        ctx.font = 'bold 15px sans-serif';
        ctx.fillText(`Auditado eletronicamente em ${new Date().toLocaleDateString('pt-BR')} • Autenticação Garantida Express Auto Tech`, 600, 820);

        // PDF Generation e Download
        const imgData = canvas.toDataURL('image/jpeg', 1.0);
        const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'px',
            format: [1200, 848]
        });
        pdf.addImage(imgData, 'JPEG', 0, 0, 1200, 848);
        pdf.save(`certificado_blindagem_${nomeOficina.toLowerCase().replace(/[^a-z0-9]/g, '_')}.pdf`);
    };

    if (carregando) {
        return (
            <div className="flex flex-col items-center justify-center py-32 gap-4 min-h-[60vh]">
                <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-slate-500 font-black uppercase tracking-[0.2em] text-xs">Carregando Conformidade Ambiental & Fiscal...</p>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-7xl space-y-8 px-4 pb-24 pt-4 text-slate-100 md:px-8 font-sans animate-fade-in">
            
            {/* SUCCESS ALERTS */}
            {msgSucesso && (
                <div className="fixed top-24 right-6 z-50 flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-950 p-4 shadow-2xl shadow-emerald-950/50 animate-bounce-short">
                    <div className="bg-emerald-500 rounded-full p-1.5 flex items-center justify-center text-slate-950">
                        <Sparkles size={18} />
                    </div>
                    <div className="text-sm font-bold text-emerald-300 tracking-tight">
                        {msgSucesso}
                    </div>
                </div>
            )}

            {/* HERO SECTION - FOCO NA PROTEÇÃO DO PATRIMÔNIO */}
            <section className="overflow-hidden rounded-[28px] border border-emerald-500/20 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.12),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(52,211,153,0.05),_transparent_28%),linear-gradient(135deg,_rgba(9,15,29,0.98),_rgba(3,7,18,0.96))] p-6 shadow-[0_25px_90px_-30px_rgba(16,185,129,0.25)]">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                    <div className="max-w-2xl">
                        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-emerald-400">
                            <ShieldCheck size={14} />
                            Proteção do Patrimônio
                        </div>
                        <h1 className="text-3xl font-black tracking-tight text-white md:text-5xl">
                            Gestão de Conformidade
                            <span className="block text-lg md:text-xl font-black text-emerald-400 uppercase tracking-widest mt-1.5 opacity-80">
                                Burocracias & Descartes
                            </span>
                        </h1>
                        <p className="mt-3 max-w-xl text-sm leading-6 text-slate-400 md:text-base">
                            Blindagem jurídica, fiscal e ambiental. Monitore alvarás críticos, gerencie logística reversa de resíduos perigosos e assegure inspeções preventivas.
                        </p>
                    </div>

                    {/* SUMMARY CARDS (GRID SUPERIOR) */}
                    {/* SUMMARY CARDS (GRID SUPERIOR DE GAMIFICAÇÃO) */}
                    <div className="grid min-w-[320px] w-full lg:w-auto gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                        
                        {/* CARD 1: STATUS DOCUMENTAÇÃO */}
                        <div className={`rounded-2xl border p-5 backdrop-blur bg-slate-950/40 shadow-lg flex flex-col justify-between relative overflow-hidden ${
                            statusDocumentacao.cor === 'rose' ? 'border-rose-500/30 shadow-rose-950/20' :
                            statusDocumentacao.cor === 'amber' ? 'border-amber-500/30 shadow-amber-950/20' : 'border-emerald-500/30 shadow-emerald-950/20'
                        }`}>
                            <div className="flex items-start justify-between">
                                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-black">Status Documental</p>
                                {statusDocumentacao.icone}
                            </div>
                            <div className="mt-4">
                                <h3 className={`text-2xl font-black uppercase ${
                                    statusDocumentacao.cor === 'rose' ? 'text-rose-400' :
                                    statusDocumentacao.cor === 'amber' ? 'text-amber-400' : 'text-emerald-400'
                                }`}>
                                    {statusDocumentacao.label}
                                </h3>
                                <p className="text-xs text-slate-400 mt-1 font-medium truncate">{statusDocumentacao.msg}</p>
                            </div>
                        </div>

                        {/* CARD 2: PRÓXIMO DESCARTE (SAO) */}
                        <div className={`rounded-2xl border p-5 backdrop-blur bg-slate-950/40 shadow-lg flex flex-col justify-between relative overflow-hidden ${
                            calculoSao.urgente ? 'border-rose-500/30' : 'border-sky-500/30'
                        }`}>
                            <div className="flex items-start justify-between">
                                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-black">Limpeza Caixa SAO</p>
                                <Droplets size={24} className={calculoSao.urgente ? 'text-rose-400' : 'text-sky-400'} />
                            </div>
                            <div className="mt-4">
                                <h3 className={`text-2xl font-black ${calculoSao.urgente ? 'text-rose-400' : 'text-slate-100'}`}>
                                    {calculoSao.dataLabel}
                                </h3>
                                <p className="text-xs text-slate-400 mt-1 font-medium">
                                    {calculoSao.diasRestantes !== null 
                                        ? (calculoSao.diasRestantes > 0 
                                            ? `${calculoSao.diasRestantes} dias restantes` 
                                            : 'ATRASADO!') 
                                        : 'Aguardando checklist'
                                    }
                                </p>
                            </div>
                        </div>

                        {/* CARD 3: SELO OFICINA BLINDADA (GAMIFICAÇÃO) */}
                        <div className={`rounded-2xl border p-5 backdrop-blur flex flex-col justify-between relative overflow-hidden transition-all duration-500 shadow-2xl ${
                            infoSelo.ativo 
                                ? 'border-emerald-500/40 shadow-[0_0_40px_rgba(16,185,129,0.15)] bg-gradient-to-br from-emerald-950/20 to-slate-950/80' 
                                : 'border-slate-800 bg-slate-950/60 grayscale opacity-75'
                        }`}>
                            {infoSelo.ativo && (
                                <div className="absolute -right-10 -top-10 w-32 h-32 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none animate-pulse"></div>
                            )}
                            <div className="flex items-start justify-between">
                                <p className={`text-[10px] uppercase tracking-[0.2em] font-black ${infoSelo.ativo ? 'text-emerald-400' : 'text-slate-500'}`}>
                                    Gamificação Comercial
                                </p>
                                <Sparkles size={22} className={infoSelo.ativo ? 'text-emerald-400 animate-pulse drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'text-slate-600'} />
                            </div>
                            <div className="mt-4 relative z-10">
                                <h3 className={`text-xl font-black tracking-tight uppercase ${infoSelo.ativo ? 'text-white' : 'text-slate-500'}`}>
                                    {infoSelo.ativo ? '🏅 Selo Ativo' : '🔒 Selo Inativo'}
                                </h3>
                                
                                {infoSelo.ativo ? (
                                    <div className="mt-3 flex flex-col xl:flex-row gap-2">
                                        <button 
                                            onClick={gerarCertificadoPDF}
                                            className="flex-1 flex items-center justify-center gap-1.5 bg-amber-600/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 px-3 py-2 rounded-xl border border-amber-500/30 text-[10px] font-black uppercase tracking-wider transition-all duration-200 active:scale-95 cursor-pointer"
                                        >
                                            🖨️ IMPRIMIR
                                        </button>
                                        <button 
                                            onClick={gerarCardInstagram}
                                            className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600/20 hover:bg-emerald-500 text-emerald-300 hover:text-slate-950 px-3 py-2 rounded-xl border border-emerald-500/30 text-[10px] font-black uppercase tracking-wider transition-all duration-200 active:scale-95 cursor-pointer"
                                        >
                                            📱 INSTAGRAM
                                        </button>
                                    </div>
                                ) : (
                                    <div className="group relative mt-1">
                                        <p className="text-[11px] text-slate-500 font-bold underline underline-offset-4 cursor-help hover:text-amber-400 transition-colors flex items-center gap-1">
                                            Ver {infoSelo.pendencias.length} pendência(s)
                                        </p>
                                        {/* Tooltip de pendências */}
                                        <div className="absolute left-0 md:right-0 bottom-full mb-2 invisible group-hover:visible z-[999] bg-slate-950 border border-slate-800 rounded-2xl p-4 w-64 shadow-2xl text-[10px] font-medium text-slate-300 animate-in fade-in duration-200 flex flex-col gap-2">
                                            <p className="text-[9px] uppercase tracking-[0.15em] font-black text-amber-400 border-b border-slate-800 pb-2">Falta desbloquear:</p>
                                            <ul className="space-y-2">
                                                {infoSelo.pendencias.map((p, i) => (
                                                    <li key={i} className="flex items-start gap-2 leading-relaxed">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 mt-1" /> <span>{p}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            </section>

            {/* SIDE-TAB LAYOUT / NAVIGATION MENU BAR */}
            <div className="flex flex-col gap-8 lg:flex-row">
                
                {/* ASIDE SUB-NAVIGATION */}
                <aside className="w-full shrink-0 space-y-2 lg:w-72">
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 px-3 mb-4 flex items-center gap-2">
                        <FileSpreadsheet size={12} /> Módulos Fiscais
                    </p>
                    <button
                        onClick={() => setAbaInterna('alvaras')}
                        className={`w-full flex items-center gap-3 rounded-2xl px-5 py-4 text-sm font-bold transition-all tracking-tight ${
                            abaInterna === 'alvaras' 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.08)]' 
                            : 'bg-slate-950/40 border border-slate-800/80 text-slate-400 hover:bg-slate-900/60 hover:border-slate-700'
                        }`}
                    >
                        <FileText size={18} className={abaInterna === 'alvaras' ? 'text-emerald-400' : 'text-slate-500'} />
                        Alvarás e Licenças
                    </button>

                    <button
                        onClick={() => setAbaInterna('descartes')}
                        className={`w-full flex items-center gap-3 rounded-2xl px-5 py-4 text-sm font-bold transition-all tracking-tight ${
                            abaInterna === 'descartes' 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.08)]' 
                            : 'bg-slate-950/40 border border-slate-800/80 text-slate-400 hover:bg-slate-900/60 hover:border-slate-700'
                        }`}
                    >
                        <Truck size={18} className={abaInterna === 'descartes' ? 'text-emerald-400' : 'text-slate-500'} />
                        Logística de Resíduos
                    </button>

                    <button
                        onClick={() => setAbaInterna('checklist')}
                        className={`w-full flex items-center gap-3 rounded-2xl px-5 py-4 text-sm font-bold transition-all tracking-tight ${
                            abaInterna === 'checklist' 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.08)]' 
                            : 'bg-slate-950/40 border border-slate-800/80 text-slate-400 hover:bg-slate-900/60 hover:border-slate-700'
                        }`}
                    >
                        <ClipboardCheck size={18} className={abaInterna === 'checklist' ? 'text-emerald-400' : 'text-slate-500'} />
                        Checklist Vigilância
                    </button>
                </aside>

                {/* MAIN CONTENT SECTION */}
                <main className="flex-1 min-w-0">
                    
                    {/* ===============================
                        ABA A: ALVARÁS E LICENÇAS
                        =============================== */}
                    {abaInterna === 'alvaras' && (
                        <div className="space-y-6 animate-in fade-in-50 duration-300">
                            <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-800/50 pb-4 px-1">
                                <div>
                                    <h2 className="text-xl font-black text-white tracking-tight uppercase">Escudo Fiscal & Jurídico</h2>
                                    <p className="text-xs text-slate-500 mt-1 font-medium">Garanta que sua oficina opere com todas as licenças obrigatórias regularizadas.</p>
                                </div>
                                <button 
                                    onClick={handleSalvarAlvaras}
                                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/10 active:scale-[0.98] flex items-center gap-2"
                                >
                                    <Save size={16} /> Salvar Tudo
                                </button>
                            </div>

                            <div className="grid gap-6 sm:grid-cols-2">
                                {/* ITEM 1: FUNCIONAMENTO */}
                                <AlvaraCard 
                                    icone={<FileText size={22} className="text-emerald-400" />}
                                    titulo="Alvará de Funcionamento"
                                    sub="Prefeitura Municipal"
                                    data={alvaras.funcionamento.dataVencimento}
                                    onDataChange={(val) => setCampoAlvara('funcionamento', 'dataVencimento', val)}
                                    anexo={alvaras.funcionamento.anexo}
                                    onAnexoChange={(val) => setCampoAlvara('funcionamento', 'anexo', val)}
                                    processarArquivo={processarArquivo}
                                />

                                {/* ITEM 2: AVCB */}
                                <AlvaraCard 
                                    icone={<Flame size={22} className="text-orange-400" />}
                                    titulo="AVCB / CLCB"
                                    sub="Corpo de Bombeiros"
                                    data={alvaras.avcb.dataVencimento}
                                    onDataChange={(val) => setCampoAlvara('avcb', 'dataVencimento', val)}
                                    anexo={alvaras.avcb.anexo}
                                    onAnexoChange={(val) => setCampoAlvara('avcb', 'anexo', val)}
                                    processarArquivo={processarArquivo}
                                />

                                {/* ITEM 3: AMBIENTAL + STATUS */}
                                <AlvaraCard 
                                    icone={<Sprout size={22} className="text-emerald-400" />}
                                    titulo="Licença Ambiental / PGRS"
                                    sub="Órgão Ambiental Estadual/Municipal"
                                    data={alvaras.ambiental.dataVencimento}
                                    onDataChange={(val) => setCampoAlvara('ambiental', 'dataVencimento', val)}
                                    anexo={alvaras.ambiental.anexo}
                                    onAnexoChange={(val) => setCampoAlvara('ambiental', 'anexo', val)}
                                    processarArquivo={processarArquivo}
                                >
                                    <div className="mt-4 pt-4 border-t border-slate-800/50 flex items-center justify-between">
                                        <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">Status da Licença</span>
                                        <select 
                                            value={alvaras.ambiental.status}
                                            onChange={(e) => setCampoAlvara('ambiental', 'status', e.target.value)}
                                            className="bg-slate-900 text-xs font-bold text-slate-200 border border-slate-800 rounded-lg px-3 py-1.5 outline-none focus:border-emerald-500/50"
                                        >
                                            <option value="Ativo">Ativo ✅</option>
                                            <option value="Inativo">Inativo ⚠️</option>
                                        </select>
                                    </div>
                                </AlvaraCard>

                                {/* ITEM 4: DEDETIZAÇÃO */}
                                <AlvaraCard 
                                    icone={<Bug size={22} className="text-indigo-400" />}
                                    titulo="Certificado de Dedetização"
                                    sub="Vigilância Sanitária"
                                    data={alvaras.dedetizacao.dataVencimento}
                                    onDataChange={(val) => setCampoAlvara('dedetizacao', 'dataVencimento', val)}
                                    anexo={alvaras.dedetizacao.anexo}
                                    onAnexoChange={(val) => setCampoAlvara('dedetizacao', 'anexo', val)}
                                    processarArquivo={processarArquivo}
                                />
                            </div>
                        </div>
                    )}

                    {/* ===============================
                        ABA B: LOGÍSTICA DE RESÍDUOS (DESCARTES)
                        =============================== */}
                    {abaInterna === 'descartes' && (
                        <div className="space-y-8 animate-in fade-in-50 duration-300">
                            
                            {/* CARD EDUCATIVO DA LEI DE ÓLEO */}
                            <div className="rounded-[20px] border border-sky-500/20 bg-sky-500/5 p-5 flex flex-col sm:flex-row gap-4 items-center shadow-[0_0_30px_rgba(14,165,233,0.05)]">
                                <div className="p-3 rounded-xl bg-sky-500/20 border border-sky-500/30 text-sky-400 shrink-0">
                                    <AlertTriangle size={24} />
                                </div>
                                <div>
                                    <h4 className="text-sm font-black text-sky-300 uppercase tracking-wide">💡 Mecânico, você sabia?</h4>
                                    <p className="text-xs text-sky-100/80 mt-1 leading-relaxed font-medium">
                                        Pela <strong>Resolução CONAMA 362/05</strong>, todo óleo usado deve ser coletado por empresa autorizada (MTR). Jogar no ralo ou destinar incorretamente pode gerar <strong>multa de até R$ 50 mil</strong> e é considerado <strong>crime ambiental</strong>. Guarde os comprovantes aqui!
                                    </p>
                                </div>
                            </div>

                            {/* FORMULÁRIO */}
                            <div className="rounded-[24px] border border-slate-800/60 bg-slate-950/60 p-6 backdrop-blur">
                                <h2 className="text-lg font-black text-white uppercase tracking-tight mb-6 flex items-center gap-2">
                                    <Truck size={20} className="text-emerald-400" /> Novo Registro de Coleta
                                </h2>

                                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3 items-end">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Tipo de Resíduo</label>
                                        <select 
                                            value={novoDescarte.tipoResiduo}
                                            onChange={(e) => setNovoDescarte({...novoDescarte, tipoResiduo: e.target.value})}
                                            className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-sm font-bold rounded-xl px-4 py-3 outline-none focus:border-emerald-500/60 h-12"
                                        >
                                            <option value="Óleo Lubrificante">Óleo Lubrificante 🛢️</option>
                                            <option value="Baterias">Baterias Usadas 🔋</option>
                                            <option value="Sucata Metálica">Descarte de Peças Inservíveis (Sucata Metálica) 🚗</option>
                                            <option value="Filtros">Filtros de Óleo/Comb 🛠️</option>
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                                            {novoDescarte.tipoResiduo === 'Sucata Metálica' ? 'Empresa de Reciclagem / Sucateiro' : 'Empresa Coletora'}
                                        </label>
                                        <input 
                                            type="text" 
                                            placeholder={novoDescarte.tipoResiduo === 'Sucata Metálica' ? 'Nome da Empresa de Reciclagem' : 'Nome da Coletora Homologada'}
                                            value={novoDescarte.coletora}
                                            onChange={(e) => setNovoDescarte({...novoDescarte, coletora: e.target.value})}
                                            className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-sm font-bold placeholder:text-slate-600 rounded-xl px-4 py-3 outline-none focus:border-emerald-500/60 h-12"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                                            {novoDescarte.tipoResiduo === 'Sucata Metálica' ? 'Nº Comprovante de Venda' : 'Manifesto MTR / Nº Comprovante'}
                                        </label>
                                        <input 
                                            type="text" 
                                            placeholder={novoDescarte.tipoResiduo === 'Sucata Metálica' ? 'Ex: Recibo-001' : 'Ex: MTR-2026001'}
                                            value={novoDescarte.manifesto}
                                            onChange={(e) => setNovoDescarte({...novoDescarte, manifesto: e.target.value})}
                                            className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-sm font-bold placeholder:text-slate-600 rounded-xl px-4 py-3 outline-none focus:border-emerald-500/60 h-12"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                                            {novoDescarte.tipoResiduo === 'Sucata Metálica' ? 'Data da Venda/Coleta' : 'Data da Coleta'}
                                        </label>
                                        <input 
                                            type="date" 
                                            value={novoDescarte.dataColeta}
                                            onChange={(e) => setNovoDescarte({...novoDescarte, dataColeta: e.target.value})}
                                            className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-sm font-bold rounded-xl px-4 py-3 outline-none focus:border-emerald-500/60 h-12"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                                            {novoDescarte.tipoResiduo === 'Sucata Metálica' ? 'Comprovante/Recibo de Venda por Peso' : 'Foto do Certificado'}
                                        </label>
                                        <div className="flex items-center gap-3 h-12">
                                            <label className="flex-1 flex items-center justify-center gap-2 border-2 border-dashed border-slate-800 bg-slate-900 hover:border-emerald-500/50 text-slate-500 hover:text-emerald-400 rounded-xl px-4 h-full text-xs font-bold cursor-pointer transition-all">
                                                <UploadCloud size={16} /> FOTO
                                                <input 
                                                    type="file" 
                                                    accept="image/*" 
                                                    onChange={(e) => processarArquivo(e, (base64) => setNovoDescarte({...novoDescarte, fotoCertificado: base64}))} 
                                                    className="hidden" 
                                                />
                                            </label>
                                            {novoDescarte.fotoCertificado && (
                                                <div className="relative w-12 h-12 rounded-xl border border-emerald-500/30 overflow-hidden shrink-0">
                                                    <img src={novoDescarte.fotoCertificado} className="w-full h-full object-cover" alt="Anexo" />
                                                    <button onClick={() => setNovoDescarte({...novoDescarte, fotoCertificado: ''})} className="absolute inset-0 bg-rose-600/80 flex items-center justify-center text-white opacity-0 hover:opacity-100 text-[9px] font-black">REMOVER</button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <button 
                                        onClick={handleSalvarDescarte}
                                        disabled={salvandoDescarte}
                                        className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-700 text-slate-950 h-12 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10 active:scale-[0.98] transition-all"
                                    >
                                        {salvandoDescarte ? 'Salvando...' : <><Plus size={16} /> Registrar Coleta</>}
                                    </button>
                                </div>
                            </div>

                            {/* TABELA DE REGISTROS */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-500 px-1">Histórico de Destinação Final</h3>

                                {descartes.length === 0 ? (
                                    <div className="rounded-3xl border-2 border-dashed border-slate-800 bg-slate-950/30 text-center py-16 text-slate-500">
                                        <Truck size={40} className="mx-auto mb-4 opacity-30 text-slate-500" />
                                        <p className="font-bold">Nenhum descarte registrado ainda.</p>
                                        <p className="text-xs mt-1">Preencha o formulário acima para iniciar o rastreio ecológico.</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/50">
                                        <table className="w-full text-left text-sm border-collapse">
                                            <thead>
                                                <tr className="bg-slate-950 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-800">
                                                    <th className="py-4 px-6">Resíduo</th>
                                                    <th className="py-4 px-6">Coletora</th>
                                                    <th className="py-4 px-6">Nº Comprovante</th>
                                                    <th className="py-4 px-6">Data Coleta</th>
                                                    <th className="py-4 px-6 text-center">Certificado</th>
                                                    <th className="py-4 px-6"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-800/50 font-medium">
                                                {descartes.map(d => (
                                                    <tr key={d.id} className="hover:bg-slate-900/30 transition-all text-slate-300">
                                                        <td className="py-4 px-6 text-slate-100 font-bold">{d.tipoResiduo}</td>
                                                        <td className="py-4 px-6">{d.coletora}</td>
                                                        <td className="py-4 px-6 font-mono text-xs text-slate-400">{d.manifesto || '-'}</td>
                                                        <td className="py-4 px-6 whitespace-nowrap">
                                                            {d.dataColeta ? new Date(d.dataColeta + 'T00:00:00').toLocaleDateString('pt-BR') : '-'}
                                                        </td>
                                                        <td className="py-4 px-6 text-center">
                                                            {d.fotoCertificado ? (
                                                                <a 
                                                                    href={d.fotoCertificado} 
                                                                    target="_blank" 
                                                                    rel="noreferrer"
                                                                    className="inline-flex text-[10px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-md px-2 py-1 uppercase hover:bg-emerald-500 hover:text-slate-950 transition-all"
                                                                >
                                                                    Ver Foto
                                                                </a>
                                                            ) : <span className="text-[10px] text-slate-600 uppercase tracking-wider">Sem Foto</span>}
                                                        </td>
                                                        <td className="py-4 px-6 text-right">
                                                            <button 
                                                                onClick={() => handleDeletarDescarte(d.id)}
                                                                className="text-rose-500/70 hover:text-rose-400 transition-colors p-2 hover:bg-rose-500/10 rounded-lg"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ===============================
                        ABA C: CHECKLIST VIGILÂNCIA
                        =============================== */}
                    {abaInterna === 'checklist' && (
                        <div className="space-y-6 animate-in fade-in-50 duration-300">
                            <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-800/50 pb-4 px-1">
                                <div>
                                    <h2 className="text-xl font-black text-white tracking-tight uppercase">Checklist de Vigilância & Operação</h2>
                                    <p className="text-xs text-slate-500 mt-1 font-medium">Inspeções recorrentes essenciais para mitigar multas de fiscalização sanitária.</p>
                                </div>
                                <button 
                                    onClick={handleSalvarChecklist}
                                    disabled={salvandoChecklist}
                                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/10 flex items-center gap-2"
                                >
                                    {salvandoChecklist ? 'Salvando...' : <><Save size={16} /> Salvar Inspeção</>}
                                </button>
                            </div>

                            <div className="rounded-3xl border border-slate-800/80 bg-slate-950/50 divide-y divide-slate-800/60 overflow-hidden backdrop-blur shadow-xl">
                                
                                {/* 1. CAIXA SEPARADORA */}
                                <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-start justify-between gap-6">
                                    <div className="space-y-2 max-w-xl">
                                        <h3 className="text-lg font-black text-slate-100 uppercase flex items-center gap-2">
                                            <Droplets className="text-sky-400" size={20} /> Caixa Separadora de Água e Óleo (SAO)
                                        </h3>
                                        <p className="text-slate-400 text-sm leading-relaxed">
                                            O registro da última higienização/coleta de lodo é necessário para comprovar destinação aos fiscais e garantir o perfeito funcionamento hidráulico. Lembrete sugerido a cada 120 dias.
                                        </p>
                                        <div className="mt-3 text-[11px] font-semibold text-rose-300 bg-rose-950/30 border border-rose-500/20 px-3 py-2 rounded-lg inline-flex items-center gap-1.5">
                                            <ShieldAlert size={13} /> A Vigilância Sanitária exige que a água saia limpa. Sem a limpeza a cada 120 dias, sua oficina pode ser interditada.
                                        </div>
                                    </div>
                                    <div className="shrink-0 w-full md:w-56 space-y-2 bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
                                        <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 block">Última Limpeza SAO</label>
                                        <input 
                                            type="date" 
                                            value={checklist.saoUltimaLimpeza}
                                            onChange={(e) => setChecklist({...checklist, saoUltimaLimpeza: e.target.value})}
                                            className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs font-bold rounded-xl px-3 py-2.5 outline-none focus:border-sky-500/50"
                                        />
                                    </div>
                                </div>

                                {/* 2. ARMAZENAMENTO DE PNEUS */}
                                <div className="p-6 md:p-8 flex items-start justify-between gap-6">
                                    <div className="space-y-2 max-w-xl">
                                        <h3 className="text-lg font-black text-slate-100 uppercase flex items-center gap-2">
                                            <CheckCircle2 className="text-emerald-400" size={20} /> Armazenamento de Pneus Usados
                                        </h3>
                                        <p className="text-slate-400 text-sm leading-relaxed">
                                            Os pneus devem obrigatoriamente estar em local coberto e seco, protegidos de chuva para impedir a proliferação de dengue e outras pragas urbanas.
                                        </p>
                                        <div className="mt-3 text-[11px] font-semibold text-amber-300 bg-amber-950/30 border border-amber-500/20 px-3 py-2 rounded-lg inline-flex items-center gap-1.5">
                                            <AlertTriangle size={13} /> Evite multas e doenças: a lei estadual exige pneus cobertos. Um pneu com água acumulada é foco de dengue e a multa é pesada!
                                        </div>
                                    </div>
                                    <div className="shrink-0 flex items-center self-center">
                                        <CheckboxGlow 
                                            checked={checklist.pneusCobertos} 
                                            onChange={(checked) => setChecklist({...checklist, pneusCobertos: checked})} 
                                        />
                                    </div>
                                </div>

                                {/* 3. ESTOCAGEM DE ÓLEO NOVO */}
                                <div className="p-6 md:p-8 flex items-start justify-between gap-6">
                                    <div className="space-y-2 max-w-xl">
                                        <h3 className="text-lg font-black text-slate-100 uppercase flex items-center gap-2">
                                            <CheckCircle2 className="text-emerald-400" size={20} /> Estocagem de Lubrificante Novo
                                        </h3>
                                        <p className="text-slate-400 text-sm leading-relaxed">
                                            Os tambores e embalagens de lubrificantes devem estar sobre diques de contenção (pallets antiderramamento) para evitar qualquer possibilidade de contaminação do solo em caso de vazamento.
                                        </p>
                                    </div>
                                    <div className="shrink-0 flex items-center self-center">
                                        <CheckboxGlow 
                                            checked={checklist.oleoContido} 
                                            onChange={(checked) => setChecklist({...checklist, oleoContido: checked})} 
                                        />
                                    </div>
                                </div>
                            </div>

                            {checklist.dataAtualizacao && (
                                <p className="text-[10px] font-medium text-slate-600 italic text-right px-2">
                                    Última inspeção registrada em {new Date(checklist.dataAtualizacao).toLocaleString('pt-BR')}
                                </p>
                            )}
                        </div>
                    )}
                </main>
            </div>
            {/* ==========================================
                MODAL ASSISTENTE DE BLINDAGEM LEGAL
                ========================================== */}
            {mostrarAssistente && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[9999] flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.08),_transparent_70%)] bg-slate-950 border border-emerald-500/30 shadow-[0_0_80px_rgba(16,185,129,0.15)] rounded-[32px] max-w-lg w-full overflow-hidden p-8 relative flex flex-col gap-6 scale-95 animate-in fade-in zoom-in-95 duration-300">
                        
                        {/* Barra de Progresso */}
                        <div className="flex items-center gap-2 absolute top-0 left-0 right-0 h-1.5 bg-slate-900">
                            <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${(passoAssistente / 2) * 100}%` }}></div>
                        </div>

                        <button 
                            onClick={concluirAssistente} 
                            className="absolute top-6 right-6 text-slate-500 hover:text-slate-300 transition-colors text-xs uppercase font-black tracking-wider"
                        >
                            Pular
                        </button>

                        <div className="flex items-center gap-3 mt-4">
                            <div className="bg-emerald-500/20 border border-emerald-500/40 p-3 rounded-2xl text-emerald-400 animate-pulse">
                                <ShieldCheck size={28} />
                            </div>
                            <div>
                                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Escola de Gestão</span>
                                <h2 className="text-xl font-black text-white tracking-tight">Assistente de Blindagem</h2>
                            </div>
                        </div>

                        {passoAssistente === 1 && (
                            <div className="space-y-6 animate-in slide-in-from-right duration-300">
                                <p className="text-sm text-slate-300 leading-relaxed font-medium">
                                    Olá! Vamos blindar sua oficina contra multas ambientais pesadas? Leva menos de 2 minutos.
                                </p>
                                
                                <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                                    <h3 className="text-sm font-black text-emerald-300 uppercase flex items-center gap-2">
                                        <Droplets size={16} /> Passo 1: Controle de Óleo Usado
                                    </h3>
                                    <p className="text-xs text-slate-400 leading-relaxed">
                                        Você já tem em mãos o <strong>certificado (MTR)</strong> da última coleta de óleo lubrificante deste mês?
                                    </p>
                                </div>

                                <div className="grid gap-3">
                                    <button 
                                        onClick={() => { setAbaInterna('descartes'); setPassoAssistente(2); }}
                                        className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                                    >
                                        Sim, quero anexar agora <Check size={16} />
                                    </button>
                                    <a 
                                        href="https://www.google.com/search?q=coletor+homologado+oleo+lubrificante+usado" 
                                        target="_blank" 
                                        rel="noreferrer"
                                        onClick={() => setPassoAssistente(2)}
                                        className="w-full bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                                    >
                                        Não sei como conseguir 💡
                                    </a>
                                </div>
                            </div>
                        )}

                        {passoAssistente === 2 && (
                            <div className="space-y-6 animate-in slide-in-from-right duration-300">
                                <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                                    <h3 className="text-sm font-black text-emerald-300 uppercase flex items-center gap-2">
                                        <Droplets size={16} className="text-sky-400" /> Passo 2: Caixa Separadora
                                    </h3>
                                    <p className="text-xs text-slate-400 leading-relaxed">
                                        A sua <strong>Caixa Separadora de Água e Óleo (SAO)</strong> foi limpa quando? É obrigatório higienizar a cada 120 dias para evitar o fechamento imediato pela Vigilância Sanitária.
                                    </p>
                                </div>

                                <div className="grid gap-3">
                                    <button 
                                        onClick={() => { setAbaInterna('checklist'); concluirAssistente(); }}
                                        className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                                    >
                                        Anotar a Data da Limpeza <Check size={16} />
                                    </button>
                                    <button 
                                        onClick={() => { concluirAssistente(); }}
                                        className="w-full bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                                    >
                                        Não sabia disso! Entendido 🎓
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="text-center">
                            <span className="text-[10px] text-slate-600 font-medium">Passo {passoAssistente} de 2 • Express Auto Tech</span>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
}

// ==============================================
// COMPONENTES LOCAIS DE SUPORTE / ESTRUTURAIS
// ==============================================

function AlvaraCard({ icone, titulo, sub, data, onDataChange, anexo, onAnexoChange, processarArquivo, children }) {
    const visualStatus = useMemo(() => {
        if (!data) return { label: 'Não informado', cor: 'text-slate-500', borda: 'border-slate-800' };
        const venc = new Date(data);
        const hoje = new Date();
        const alertLim = new Date();
        alertLim.setDate(hoje.getDate() + 30);

        if (venc < hoje) return { label: 'VENCIDO', cor: 'text-rose-500', borda: 'border-rose-500/30 shadow-rose-950/20' };
        if (venc <= alertLim) return { label: 'EM ALERTA (< 30D)', cor: 'text-amber-500', borda: 'border-amber-500/30 shadow-amber-950/20' };
        return { label: 'REGULAR', cor: 'text-emerald-500', borda: 'border-emerald-500/20' };
    }, [data]);

    return (
        <div className={`rounded-[24px] border bg-slate-950/80 p-6 shadow-xl backdrop-blur flex flex-col h-full transition-all ${visualStatus.borda}`}>
            <div className="flex items-start justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 shadow-inner">{icone}</div>
                    <div>
                        <h3 className="font-black text-slate-100 text-sm uppercase tracking-tight leading-tight">{titulo}</h3>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">{sub}</p>
                    </div>
                </div>
                <div className={`text-[9px] font-black uppercase border border-current px-2 py-1 rounded-md shrink-0 ${visualStatus.cor} bg-opacity-5 bg-current`}>
                    {visualStatus.label}
                </div>
            </div>

            <div className="space-y-4 mt-auto">
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-1.5">
                        <Calendar size={12} /> Data de Vencimento
                    </label>
                    <input 
                        type="date" 
                        value={data}
                        onChange={(e) => onDataChange(e.target.value)}
                        className={`w-full bg-slate-900/60 border text-xs font-bold rounded-xl px-4 py-3 text-slate-200 outline-none transition focus:border-emerald-500/60 ${
                            visualStatus.label === 'VENCIDO' ? 'border-rose-900/50 focus:border-rose-500/70' : 'border-slate-800'
                        }`}
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-1.5">
                        <UploadCloud size={12} /> Comprovante / Certificado
                    </label>
                    <div className="flex items-center gap-3">
                        <label className="flex-1 flex items-center justify-center gap-2 border-2 border-dashed border-slate-800 bg-slate-900/30 hover:border-emerald-500/30 text-slate-500 hover:text-emerald-400 transition-all rounded-xl p-4 text-xs font-black cursor-pointer uppercase">
                            <UploadCloud size={16} /> 
                            {anexo ? 'SUBSTITUIR' : 'ANEXAR PDF / FOTO'}
                            <input 
                                type="file" 
                                accept="image/*,application/pdf" 
                                onChange={(e) => processarArquivo(e, onAnexoChange)} 
                                className="hidden" 
                            />
                        </label>
                        
                        {anexo && (
                            <div className="relative w-16 h-14 rounded-xl border border-slate-800 overflow-hidden shrink-0 group">
                                <div className="w-full h-full bg-slate-900 flex flex-col items-center justify-center gap-1">
                                    <FileText size={20} className="text-emerald-400" />
                                    <span className="text-[7px] font-black text-emerald-400 uppercase tracking-tighter">OK</span>
                                </div>
                                <button 
                                    onClick={() => onAnexoChange('')}
                                    className="absolute inset-0 bg-rose-500/90 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center text-white text-[8px] font-black"
                                >
                                    REMOVER
                                </button>
                                <a 
                                    href={anexo} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="absolute bottom-0 left-0 right-0 bg-slate-950/80 text-center text-[8px] font-bold text-slate-400 py-0.5 opacity-100 group-hover:opacity-0 transition-all"
                                >
                                    VER
                                </a>
                            </div>
                        )}
                    </div>
                </div>

                {children}
            </div>
        </div>
    );
}

function CheckboxGlow({ checked, onChange }) {
    return (
        <button 
            type="button"
            onClick={() => onChange(!checked)}
            className={`w-14 h-8 rounded-full relative p-1 transition-all duration-300 cursor-pointer outline-none border ${
                checked 
                ? 'bg-emerald-500/20 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.2)]' 
                : 'bg-slate-900 border-slate-800'
            }`}
        >
            <div className={`w-5.5 h-5.5 rounded-full absolute top-1 transition-all duration-300 flex items-center justify-center ${
                checked 
                ? 'bg-emerald-500 left-7.5 shadow-[0_0_10px_rgba(16,185,129,0.5)] text-slate-950' 
                : 'bg-slate-700 left-1 text-slate-900'
            }`}>
                {checked && <Check size={12} strokeWidth={4} />}
            </div>
        </button>
    );
}
