import { useEffect, useRef, useState } from "react";

import {
  bandaPorAmplitude,
  novoContador,
  passoContador,
  presencaDe,
  type ContadorReps,
  type MetodoProva,
  type ProvaCorpo,
  type ResultadoProva,
} from "@/lib/provas";
import type { DetectorPose, PontoPose } from "@/lib/pose-loader";

type Fase = "abrindo" | "calibrando" | "contando" | "pronta" | "erro";

type Props = {
  prova: ProvaCorpo;
  onConcluir: (resultado: ResultadoProva) => void;
  onFechar: () => void;
};

const QUADRO_W = 480;
const QUADRO_H = 360;

/**
 * Prova física verificada no navegador.
 *
 * Tenta estimar o esqueleto (MoveNet, carregado sob demanda). Sem rede para o
 * modelo, cai para diferença de quadros. Nos dois casos a contagem é um ciclo
 * completo com histerese e janela de tempo — e o método usado fica registrado
 * na evidência: a prova declara como foi feita. Nada sai do dispositivo.
 */
export function ProvaCamera({ prova, onConcluir, onFechar }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const amostraRef = useRef<HTMLCanvasElement | null>(null);
  const overlayRef = useRef<HTMLCanvasElement | null>(null);

  const [fase, setFase] = useState<Fase>("abrindo");
  const [erro, setErro] = useState<string | null>(null);
  const [metodo, setMetodo] = useState<MetodoProva>("movimento");
  const [reps, setReps] = useState(0);
  const [segundos, setSegundos] = useState(0);
  const [presenca, setPresenca] = useState(1);
  const [aviso, setAviso] = useState<string | null>(null);
  const [resultado, setResultado] = useState<ResultadoProva | null>(null);

  useEffect(() => {
    let vivo = true;
    let raf = 0;
    let ultimoFrame = 0;
    let inicio = 0;
    let calibrando = true;
    let detector: DetectorPose | null = null;
    let stream: MediaStream | null = null;
    let contador: ContadorReps = novoContador(prova.bandaMinima);
    let quadroAnterior: Uint8ClampedArray | null = null;
    let ultimoSinal = 0.5;

    function desenharEsqueleto(pontos: PontoPose[]) {
      const canvas = overlayRef.current;
      const video = videoRef.current;
      if (!canvas || !video) return;
      if (canvas.width !== QUADRO_W) {
        canvas.width = QUADRO_W;
        canvas.height = QUADRO_H;
      }
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, QUADRO_W, QUADRO_H);
      ctx.fillStyle = "rgba(253, 230, 138, 0.9)";
      for (const p of pontos) {
        if ((p.score ?? 0) < 0.3) continue;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function sinalDePose(pontos: PontoPose[]): number | null {
      const ombros = pontos.filter(
        (p) => (p.name === "left_shoulder" || p.name === "right_shoulder") && (p.score ?? 0) > 0.3,
      );
      if (ombros.length === 0) return null;
      return ombros.reduce((s, p) => s + p.y, 0) / ombros.length / QUADRO_H;
    }

    function sinalDeMovimento(video: HTMLVideoElement): number | null {
      const canvas = amostraRef.current;
      if (!canvas) return null;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return null;
      const w = (canvas.width = 48);
      const h = (canvas.height = 36);
      ctx.drawImage(video, 0, 0, w, h);
      const dados = ctx.getImageData(0, 0, w, h).data;
      if (!quadroAnterior) {
        quadroAnterior = new Uint8ClampedArray(dados);
        return null;
      }
      let soma = 0;
      let peso = 0;
      for (let i = 0; i < dados.length; i += 4) {
        const d =
          Math.abs(dados[i]! - quadroAnterior[i]!) +
          Math.abs(dados[i + 1]! - quadroAnterior[i + 1]!) +
          Math.abs(dados[i + 2]! - quadroAnterior[i + 2]!);
        if (d > 60) {
          soma += Math.floor(i / 4 / w);
          peso += 1;
        }
      }
      quadroAnterior = new Uint8ClampedArray(dados);
      if (peso < w * h * 0.01) return null;
      return soma / peso / h;
    }

    async function laco(agora: number) {
      if (!vivo) return;
      raf = requestAnimationFrame(laco);
      if (agora - ultimoFrame < 90) return; // ~11 fps basta para contar ciclos
      ultimoFrame = agora;

      const video = videoRef.current;
      if (!video || video.readyState < 2) return;

      let sinal: number | null = null;
      if (detector) {
        try {
          const poses = await detector.estimatePoses(video);
          if (poses[0]) {
            desenharEsqueleto(poses[0].keypoints);
            sinal = sinalDePose(poses[0].keypoints);
          }
        } catch {
          sinal = null;
        }
      }
      if (sinal == null) sinal = sinalDeMovimento(video);

      if (sinal == null) {
        contador = passoContador(contador, ultimoSinal, agora, false);
        if (!calibrando) setAviso("Não estou vendo o corpo no quadro.");
        setPresenca(presencaDe(contador));
        return;
      }
      ultimoSinal = sinal;
      setAviso(null);

      if (calibrando) {
        contador = passoContador(contador, sinal, agora);
        if (contador.reps >= 1) {
          const quadros = contador.quadros;
          const validos = contador.quadrosValidos;
          contador = {
            ...novoContador(bandaPorAmplitude(contador.amplitude, prova.bandaMinima)),
            quadros,
            quadrosValidos: validos,
          };
          calibrando = false;
          inicio = agora;
          setFase("contando");
        } else if (agora - inicio > 15_000) {
          setErro("Não consegui calibrar: faça uma repetição inteira, devagar, dentro do quadro.");
          setFase("erro");
          return;
        }
        setPresenca(presencaDe(contador));
        return;
      }

      contador = passoContador(contador, sinal, agora);
      setReps(contador.reps);
      setSegundos(Math.round((agora - inicio) / 1000));
      setPresenca(presencaDe(contador));

      if (contador.reps >= prova.meta) {
        cancelAnimationFrame(raf);
        setResultado({
          provaId: prova.id,
          reps: contador.reps,
          segundos: Math.round((agora - inicio) / 1000),
          metodo: detector ? "pose" : "movimento",
          presenca: presencaDe(contador),
        });
        setFase("pronta");
      }
    }

    async function abrir() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: QUADRO_W, height: QUADRO_H },
          audio: false,
        });
        if (!vivo) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play();

        try {
          // no servidor o tfjs nem entra no bundle (DCE); a prova só existe no navegador
          const modulo = import.meta.env.SSR ? null : await import("@/lib/pose-loader");
          detector = modulo ? await modulo.criarDetector() : null;
        } catch {
          detector = null;
        }
        if (!vivo) return;
        setMetodo(detector ? "pose" : "movimento");
        inicio = performance.now();
        setFase("calibrando");
        raf = requestAnimationFrame(laco);
      } catch {
        if (!vivo) return;
        setErro(
          "Não consegui abrir a câmera. Sem câmera não há prova — e tudo bem: descrever a evidência continua valendo.",
        );
        setFase("erro");
      }
    }

    void abrir();

    return () => {
      vivo = false;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
      detector?.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prova.id]);

  return (
    <div className="fixed inset-0 z-50 grid place-items-start overflow-y-auto bg-background/90 px-4 py-8 backdrop-blur-md">
      <div className="glass-strong arcane-glow rise-in w-full max-w-md p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="label-arcane text-primary">Prova física</div>
            <h2 className="mt-1.5 font-display text-subtitle leading-tight">
              {prova.nome} · meta {prova.meta}
            </h2>
            <p className="mt-1 text-micro text-muted-foreground">{prova.posicionamento}</p>
          </div>
          <button
            type="button"
            onClick={onFechar}
            className="rounded-full border border-border px-3 py-1 text-micro text-muted-foreground transition-colors hover:text-foreground"
          >
            fechar
          </button>
        </div>

        <div className="relative mt-4 overflow-hidden rounded-xl border border-border bg-black/60">
          <video
            ref={videoRef}
            muted
            playsInline
            className="aspect-[4/3] w-full -scale-x-100 object-cover"
          />
          <canvas
            ref={overlayRef}
            aria-hidden
            className="pointer-events-none absolute inset-0 h-full w-full -scale-x-100"
          />
          <canvas ref={amostraRef} className="hidden" aria-hidden />

          <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-2 bg-gradient-to-b from-black/70 to-transparent px-3 py-2">
            <span className="chip-muted">
              {metodo === "pose" ? "verificação por pose" : "verificação por movimento"}
            </span>
            {(fase === "contando" || fase === "pronta") && (
              <span className="chip-arcane">
                {segundos}s · corpo visível {Math.round(presenca * 100)}%
              </span>
            )}
          </div>

          <div className="absolute inset-0 grid place-items-center">
            {fase === "abrindo" && (
              <p className="rounded-xl bg-black/60 px-4 py-2 text-small text-foreground">
                abrindo câmera...
              </p>
            )}
            {fase === "calibrando" && (
              <p className="max-w-[16rem] rounded-xl bg-black/60 px-4 py-3 text-center text-small text-foreground">
                Faça <strong>1 repetição inteira</strong>, devagar, para calibrar a sua amplitude.
              </p>
            )}
            {fase === "erro" && (
              <p className="max-w-[18rem] rounded-xl bg-black/70 px-4 py-3 text-center text-small text-ember">
                {erro}
              </p>
            )}
          </div>

          {(fase === "contando" || fase === "pronta") && (
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-gradient-to-t from-black/80 to-transparent px-4 pb-3 pt-8">
              <div>
                <p className="font-display text-hero leading-none text-primary">{reps}</p>
                <p className="text-micro text-muted-foreground">de {prova.meta} repetições</p>
              </div>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/15">
                <div
                  className="h-full rounded-full bg-primary transition-[width] duration-300 ease-arcane"
                  style={{ width: `${Math.min(100, (reps / prova.meta) * 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {aviso && fase === "contando" && <p className="mt-2 text-micro text-ember">{aviso}</p>}

        {fase === "pronta" && resultado ? (
          <div className="mt-4 space-y-3">
            <p className="text-small">
              <strong className="text-primary">
                {resultado.reps} {prova.nome.toLowerCase()}
              </strong>{" "}
              em {resultado.segundos}s, contadas aqui no navegador (
              {resultado.metodo === "pose" ? "esqueleto estimado" : "movimento do corpo"}), com o
              corpo visível {Math.round(resultado.presenca * 100)}% do tempo. É isso que transforma
              uma evidência em prova.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onConcluir(resultado)}
                className="ember-glow flex-1 rounded-xl bg-primary px-5 py-2.5 text-small font-medium text-primary-foreground transition-transform duration-[var(--duration-fast)] ease-arcane hover:scale-[1.02]"
              >
                Confirmar prova
              </button>
              <button
                type="button"
                onClick={onFechar}
                className="rounded-xl border border-border px-4 py-2.5 text-small text-muted-foreground transition-colors duration-[var(--duration-fast)] hover:text-foreground"
              >
                descartar
              </button>
            </div>
          </div>
        ) : (
          <p className="mt-3 text-micro text-muted-foreground">
            Nada sai do seu dispositivo: a contagem acontece neste navegador, quadro a quadro.
          </p>
        )}
      </div>
    </div>
  );
}
