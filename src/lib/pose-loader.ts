/**
 * Carrega o MoveNet (tfjs) SOB DEMANDA — este módulo só entra no bundle da
 * prova física, nunca no SSR nem no carregamento inicial do app.
 *
 * Os pesos do modelo vêm do runtime tfjs no navegador da pessoa; se não
 * houver rede para eles, quem chama recebe um erro e cai para o modo
 * movimento (diferença de quadros), que não precisa de nada externo.
 */
import * as poseDetection from "@tensorflow-models/pose-detection";
import "@tensorflow/tfjs-backend-webgl";

export type PontoPose = { name?: string; x: number; y: number; score?: number };

export type DetectorPose = {
  estimatePoses: (video: HTMLVideoElement) => Promise<Array<{ keypoints: PontoPose[] }>>;
  dispose: () => void;
};

export async function criarDetector(): Promise<DetectorPose> {
  const detector = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, {
    modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
  });
  return detector as unknown as DetectorPose;
}
