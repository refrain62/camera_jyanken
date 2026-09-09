import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MToonMaterial, VRM, VRMHumanBoneName, VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';
import { GameResult, GameStage, HandGesture } from '../types/janken';

interface GirlAvatar3DProps {
  stage: GameStage;
  cpuHand: HandGesture;
  result: GameResult | null;
}

/** 同梱VRMの骨格と表情をゲーム状態に同期し、終了時にGPU資源を解放する。 */
export const GirlAvatar3D: React.FC<GirlAvatar3DProps> = ({ stage, cpuHand, result }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const propsRef = useRef({ stage, cpuHand, result });
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => { propsRef.current = { stage, cpuHand, result }; }, [stage, cpuHand, result]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let disposed = false;
    let vrm: VRM | undefined;
    let frame = 0;
    setStatus('loading');
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      setStatus('error');
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight(0xffffff, 0xc3b3cc, 1.2));
    const light = new THREE.DirectionalLight(0xfff3e8, 1.3);
    light.position.set(1, 2, 3);
    scene.add(light);
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 20);
    camera.position.set(0, 1.25, 1.65);
    camera.lookAt(0, 1.22, 0);
    const resize = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      if (!width || !height) return;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      // 狭いカードでも顔と両肩が切れない距離を確保する。
      camera.position.z = Math.max(1.65, 1.1 / camera.aspect);
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    resize();

    const loader = new GLTFLoader();
    loader.register((parser) => new VRMLoaderPlugin(parser));
    // Pagesのサブパスに対応。モデルは同梱し、外部サービスへ依存しない。
    loader.load(`${import.meta.env.BASE_URL}models/girl.vrm`, (gltf) => {
      const loaded = gltf.userData.vrm as VRM;
      if (disposed) { VRMUtils.deepDispose(loaded.scene); return; }
      vrm = loaded;
      VRMUtils.rotateVRM0(vrm);
      scene.add(vrm.scene);
      vrm.scene.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        for (const material of materials) {
          if (material instanceof MToonMaterial && material.name === 'Tops_01_CLOTH') {
            material.color.set('#f4b9ce');
            material.shadeColorFactor.set('#d58da9');
          }
        }
      });
      vrm.scene.traverse((object) => { object.frustumCulled = false; });
      setStatus('ready');
    }, undefined, () => { if (!disposed) setStatus('error'); });

    const clock = new THREE.Clock();
    const rotate = (name: VRMHumanBoneName, x: number, y: number, z: number) => {
      vrm?.humanoid.getNormalizedBoneNode(name)?.rotation.set(x, y, z);
    };
    const animate = () => {
      frame = requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.05);
      const t = clock.elapsedTime;
      if (vrm) {
        const { stage: currentStage, cpuHand: hand, result: outcome } = propsRef.current;
        const counting = currentStage.startsWith('COUNTDOWN_');
        const showing = currentStage === 'JUDGEMENT' || currentStage === 'RESULT';
        vrm.humanoid.resetNormalizedPose();
        rotate('leftUpperArm', 0, 0, -1.18);
        rotate('leftLowerArm', 0, -0.15, -0.12);
        rotate('rightUpperArm', 0, 0, showing || counting ? 1.3 : 1.16);
        rotate('rightLowerArm', 0, 0, showing ? -2.7 : counting ? -2.7 + Math.sin(t * 12) * 0.12 : -0.12);
        rotate('rightHand', showing || counting ? -Math.PI / 2 : 0, 0, showing ? -0.15 : 0);
        rotate('chest', 0.01 * Math.sin(t * 2), 0.025 * Math.sin(t), 0);
        const fingers = ['Index', 'Middle', 'Ring', 'Little'] as const;
        fingers.forEach((finger) => {
          const extended = showing && (hand === 'PAPER' || (hand === 'SCISSORS' && (finger === 'Index' || finger === 'Middle')));
          const curl = extended ? 0 : showing || counting ? 1.3 : 0.18;
          for (const joint of ['Proximal', 'Intermediate', 'Distal'] as const) {
            const spread = extended && joint === 'Proximal' ? (finger === 'Index' ? 0.14 : finger === 'Middle' ? -0.08 : -0.12) : 0;
            rotate(`right${finger}${joint}`, 0, spread, curl);
          }
        });
        const closedThumb = counting || (showing && hand !== 'PAPER');
        rotate('rightThumbMetacarpal', 0, closedThumb ? -0.5 : 0, -0.25);
        rotate('rightThumbProximal', 0, closedThumb ? -0.9 : 0, 0);
        rotate('rightThumbDistal', 0, closedThumb ? -0.9 : 0, 0);
        const expressions = vrm.expressionManager;
        expressions?.setValue('happy', currentStage === 'RESULT' && outcome === 'LOSE' ? 0.85 : currentStage === 'RESULT' ? 0 : 0.25);
        expressions?.setValue('sad', currentStage === 'RESULT' && outcome === 'WIN' ? 0.65 : 0);
        expressions?.setValue('surprised', currentStage === 'RESULT' && outcome === 'DRAW' ? 0.4 : 0);
        expressions?.setValue('blink', t % 4.2 > 4.05 ? 1 : 0);
        rotate('head', currentStage === 'RESULT' && outcome === 'WIN' ? 0.12 : 0, Math.sin(t * 0.7) * 0.04, currentStage === 'RESULT' && outcome === 'DRAW' ? 0.12 : Math.sin(t) * 0.025);
        vrm.update(delta);
      }
      renderer.render(scene, camera);
    };
    animate();
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      if (vrm) VRMUtils.deepDispose(vrm.scene);
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [attempt]);

  return (
    <div style={{ position: 'relative', width: '100%', borderRadius: 16, overflow: 'hidden', background: 'radial-gradient(ellipse at 50% 40%, #393047 0%, #1c1e30 55%, #101620 100%)' }}>
      <div ref={containerRef} role="img" aria-label="女の子の3D対戦相手" style={{ width: '100%', height: 340 }} />
      {status !== 'ready' && <div role="status" style={{ position: 'absolute', inset: 0, display: 'grid', placeContent: 'center', gap: 12, textAlign: 'center', background: '#171b29' }}>
        {status === 'loading' ? '対戦相手を読み込んでいます…' : <><span>対戦相手を読み込めませんでした</span><button onClick={() => setAttempt((value) => value + 1)}>再読み込み</button></>}
      </div>}
    </div>
  );
};
