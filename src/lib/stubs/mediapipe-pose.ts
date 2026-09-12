/**
 * Stub de build.
 *
 * O @tensorflow-models/pose-detection importa estaticamente o `Pose` do
 * @mediapipe/pose (a solução BlazePose, empacotada como script UMD). O app só
 * usa MoveNet, que não precisa de MediaPipe — mas o import existe e quebrava
 * o bundle. Este stub satisfaz o import; se alguém tentar instanciá-lo,
 * recebe um erro claro em vez de silêncio.
 */
export class Pose {
  constructor() {
    throw new Error(
      "A solução BlazePose (MediaPipe) não está disponível neste app. Use o MoveNet via criarDetector().",
    );
  }
}

export default Pose;
