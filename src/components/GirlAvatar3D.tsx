/**
 * 女の子の3Dアバター WebGL レンダリングコンポーネント (Three.js)
 */

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GameResult, GameStage, HandGesture } from '../types/janken';

interface GirlAvatar3DProps {
  stage: GameStage;
  cpuHand: HandGesture;
  result: GameResult | null;
}

/**
 * 3D女の子アバターコンポーネント
 */
export const GirlAvatar3D: React.FC<GirlAvatar3DProps> = ({ stage, cpuHand, result }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  // 各パーツのリファレンスを保持
  const avatarGroupRef = useRef<THREE.Group | null>(null);
  const headGroupRef = useRef<THREE.Group | null>(null);
  const leftSideHairRef = useRef<THREE.Mesh | null>(null);
  const rightSideHairRef = useRef<THREE.Mesh | null>(null);
  const rightArmGroupRef = useRef<THREE.Group | null>(null);
  const leftArmGroupRef = useRef<THREE.Group | null>(null);
  const eyeLeftMeshRef = useRef<THREE.Mesh | null>(null);
  const eyeRightMeshRef = useRef<THREE.Mesh | null>(null);
  const mouthMeshRef = useRef<THREE.Mesh | null>(null);

  // 指のメッシュリファレンス (親指, 人差し指, 中指, 薬指, 小指)
  const fingersRef = useRef<{
    thumb: THREE.Mesh;
    index: THREE.Mesh;
    middle: THREE.Mesh;
    ring: THREE.Mesh;
    pinky: THREE.Mesh;
  } | null>(null);

  // 最新の stage, cpuHand, result をアニメーションループ内で参照するための ref
  const propsRef = useRef({ stage, cpuHand, result });
  useEffect(() => {
    propsRef.current = { stage, cpuHand, result };
  }, [stage, cpuHand, result]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 300;
    const height = container.clientHeight || 240;

    // 1. Scene 設定
    const scene = new THREE.Scene();

    // 2. Camera 設定
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 1.25, 2.7);
    camera.lookAt(0, 1.05, 0);

    // 3. Renderer 設定
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // 既存キャンバスの重複除去
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. ライティング設定
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.95);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.1);
    dirLight.position.set(2, 4, 3);
    scene.add(dirLight);

    const pointLight = new THREE.PointLight(0xffd5c2, 1.2, 5);
    pointLight.position.set(-1.5, 2, 1);
    scene.add(pointLight);

    // 5. アバターモデルの構築 (Three.js プロシージャル合成)
    const avatarGroup = new THREE.Group();
    avatarGroupRef.current = avatarGroup;
    scene.add(avatarGroup);

    // マテリアルカラー定義 (初音女の子カラーパレット)
    const hairMat = new THREE.MeshStandardMaterial({
      color: 0x694332, // チェスナットブラウン
      roughness: 0.3,
      metalness: 0.1,
    });
    const skinMat = new THREE.MeshStandardMaterial({
      color: 0xffdfc4, // 色白肌
      roughness: 0.6,
    });
    const clothesBlackMat = new THREE.MeshStandardMaterial({
      color: 0x76516e, // モーブ
      roughness: 0.4,
    });
    const clothesWhiteMat = new THREE.MeshStandardMaterial({
      color: 0xffb8ca,
      roughness: 0.3,
    });
    const ribbonMat = new THREE.MeshStandardMaterial({
      color: 0xfff0dc,
      roughness: 0.2,
      metalness: 0.3,
    });
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x51352a }); // ブラウン
    const mouthMat = new THREE.MeshBasicMaterial({ color: 0xe65c00 });

    // --- 胴体 (Body & Shirt) ---
    const torsoGeo = new THREE.CylinderGeometry(0.22, 0.18, 0.6, 16);
    const torsoMesh = new THREE.Mesh(torsoGeo, clothesWhiteMat);
    torsoMesh.position.set(0, 0.8, 0);
    avatarGroup.add(torsoMesh);

    // 襟元のリボン
    const ribbonGeo = new THREE.SphereGeometry(0.045, 16, 12);
    for (const side of [-1, 1]) {
      const ribbonMesh = new THREE.Mesh(ribbonGeo, ribbonMat);
      ribbonMesh.scale.set(1.2, 0.65, 0.4);
      ribbonMesh.position.set(side * 0.04, 1.0, 0.2);
      ribbonMesh.rotation.z = side * 0.3;
      avatarGroup.add(ribbonMesh);
    }
    // スカート/腰回り
    const skirtGeo = new THREE.ConeGeometry(0.32, 0.25, 16);
    const skirtMesh = new THREE.Mesh(skirtGeo, clothesBlackMat);
    skirtMesh.position.set(0, 0.45, 0);
    avatarGroup.add(skirtMesh);

    // --- 頭部 (Head & Hair) ---
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 1.25, 0);
    headGroupRef.current = headGroup;
    avatarGroup.add(headGroup);

    // 顔 (Sphere)
    const headGeo = new THREE.SphereGeometry(0.26, 32, 32);
    const headMesh = new THREE.Mesh(headGeo, skinMat);
    headGroup.add(headMesh);

    // 前髪 (Hair Bangs)
    const bangsGeo = new THREE.SphereGeometry(0.27, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.45);
    const bangsMesh = new THREE.Mesh(bangsGeo, hairMat);
    bangsMesh.rotation.x = 0.2;
    headGroup.add(bangsMesh);

    // 目 (Left & Right Eyes)
    const eyeGeo = new THREE.PlaneGeometry(0.06, 0.09);

    const eyeLeft = new THREE.Mesh(eyeGeo, eyeMat);
    eyeLeft.position.set(-0.09, 0.03, 0.25);
    headGroup.add(eyeLeft);
    eyeLeftMeshRef.current = eyeLeft;

    const eyeRight = new THREE.Mesh(eyeGeo, eyeMat);
    eyeRight.position.set(0.09, 0.03, 0.25);
    headGroup.add(eyeRight);
    eyeRightMeshRef.current = eyeRight;

    // 口 (Mouth)
    const mouthGeo = new THREE.RingGeometry(0.01, 0.03, 16, 1, 0, Math.PI);
    const mouthMesh = new THREE.Mesh(mouthGeo, mouthMat);
    mouthMesh.position.set(0, -0.09, 0.25);
    mouthMesh.rotation.z = Math.PI;
    headGroup.add(mouthMesh);
    mouthMeshRef.current = mouthMesh;

    // 後ろ髪を顔の背面に置き、目と口を隠さない。
    const backHair = new THREE.Mesh(new THREE.SphereGeometry(0.28, 32, 24), hairMat);
    backHair.scale.set(1.02, 1.12, 0.65);
    backHair.position.set(0, -0.015, -0.12);
    headGroup.add(backHair);

    // 両側の短い髪でボブヘアの輪郭を作る。
    const sideHairGeo = new THREE.SphereGeometry(1, 20, 16);
    sideHairGeo.scale(0.075, 0.22, 0.12);
    sideHairGeo.translate(0, -0.12, 0);
    const leftSideHair = new THREE.Mesh(sideHairGeo, hairMat);
    leftSideHair.position.set(-0.235, 0.04, 0);
    headGroup.add(leftSideHair);
    leftSideHairRef.current = leftSideHair;
    const rightSideHair = new THREE.Mesh(sideHairGeo, hairMat);
    rightSideHair.position.set(0.235, 0.04, 0);
    headGroup.add(rightSideHair);
    rightSideHairRef.current = rightSideHair;
    // --- 左腕 (Left Arm - 待機用) ---
    const leftArmGroup = new THREE.Group();
    leftArmGroup.position.set(-0.28, 1.0, 0);
    avatarGroup.add(leftArmGroup);
    leftArmGroupRef.current = leftArmGroup;

    const leftArmGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.45, 16);
    leftArmGeo.translate(0, -0.22, 0);
    const leftArmMesh = new THREE.Mesh(leftArmGeo, skinMat);
    leftArmMesh.rotation.z = 0.2;
    leftArmGroup.add(leftArmMesh);

    // --- 右腕 (Right Arm - じゃんけん対戦用) ---
    const rightArmGroup = new THREE.Group();
    rightArmGroup.position.set(0.28, 1.0, 0);
    avatarGroup.add(rightArmGroup);
    rightArmGroupRef.current = rightArmGroup;

    const rightArmGeo = new THREE.CylinderGeometry(0.05, 0.045, 0.45, 16);
    rightArmGeo.translate(0, -0.22, 0);
    const rightArmMesh = new THREE.Mesh(rightArmGeo, skinMat);
    rightArmGroup.add(rightArmMesh);

    // 右手掌 & 3D指構造 (Right Hand & 5 Fingers)
    const rightHandGroup = new THREE.Group();
    rightHandGroup.position.set(0, -0.45, 0);
    rightArmGroup.add(rightHandGroup);

    const palmGeo = new THREE.BoxGeometry(0.09, 0.09, 0.04);
    const palmMesh = new THREE.Mesh(palmGeo, skinMat);
    rightHandGroup.add(palmMesh);

    // 指の作成関数
    const createFinger = (xOffset: number, yOffset: number, zOffset: number, length: number): THREE.Mesh => {
      const fingerGeo = new THREE.CylinderGeometry(0.012, 0.01, length, 8);
      fingerGeo.translate(0, -length / 2, 0); // 根本を軸にする
      const fingerMesh = new THREE.Mesh(fingerGeo, skinMat);
      fingerMesh.position.set(xOffset, yOffset, zOffset);
      rightHandGroup.add(fingerMesh);
      return fingerMesh;
    };

    const thumb = createFinger(0.045, -0.02, 0.01, 0.06);
    thumb.rotation.z = -0.6;

    const index = createFinger(0.03, -0.045, 0, 0.08);
    const middle = createFinger(0.01, -0.045, 0, 0.09);
    const ring = createFinger(-0.01, -0.045, 0, 0.08);
    const pinky = createFinger(-0.03, -0.045, 0, 0.065);

    fingersRef.current = { thumb, index, middle, ring, pinky };

    // 6. レンダリング＆アニメーションループ
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();
      const { stage: curStage, cpuHand: curCpuHand, result: curResult } = propsRef.current;

      // (A) アバター全体のアニメーション（待機中の浮遊・呼吸）
      if (avatarGroupRef.current) {
        avatarGroupRef.current.position.y = Math.sin(elapsedTime * 2) * 0.03;
      }

      // サイドヘアのなびき
      if (leftSideHairRef.current && rightSideHairRef.current) {
        leftSideHairRef.current.rotation.z = 0.03 + Math.sin(elapsedTime * 3) * 0.025;
        rightSideHairRef.current.rotation.z = -0.03 - Math.sin(elapsedTime * 3) * 0.025;
        leftSideHairRef.current.rotation.x = Math.cos(elapsedTime * 2.5) * 0.05;
        rightSideHairRef.current.rotation.x = Math.cos(elapsedTime * 2.5) * 0.05;
      }

      // (B) ステージに応じたモーション制御
      const isCountdown =
        curStage === 'COUNTDOWN_JAN' ||
        curStage === 'COUNTDOWN_KEN' ||
        curStage === 'COUNTDOWN_PON' ||
        curStage === 'COUNTDOWN_AIKO' ||
        curStage === 'COUNTDOWN_SHO';

      if (rightArmGroupRef.current && fingersRef.current) {
        if (isCountdown) {
          // カウントダウン中: 右腕を前後に元気に振るシェイクポーズ
          rightArmGroupRef.current.rotation.x = -Math.PI * 0.4 + Math.sin(elapsedTime * 14) * 0.25;
          rightArmGroupRef.current.rotation.z = -0.2;

          // 手をぐっと握るグーに近い状態
          const f = fingersRef.current;
          f.index.rotation.x = Math.PI * 0.6;
          f.middle.rotation.x = Math.PI * 0.6;
          f.ring.rotation.x = Math.PI * 0.6;
          f.pinky.rotation.x = Math.PI * 0.6;
          f.thumb.rotation.x = Math.PI * 0.3;
        } else if (curStage === 'JUDGEMENT' || curStage === 'RESULT') {
          // じゃんけん手を決定して前に突出す
          rightArmGroupRef.current.rotation.x = -Math.PI * 0.45;
          rightArmGroupRef.current.rotation.z = -0.1;

          const f = fingersRef.current;
          if (curCpuHand === 'ROCK') {
            // グー: 全指折り曲げ
            f.index.rotation.x = Math.PI * 0.75;
            f.middle.rotation.x = Math.PI * 0.75;
            f.ring.rotation.x = Math.PI * 0.75;
            f.pinky.rotation.x = Math.PI * 0.75;
            f.thumb.rotation.x = Math.PI * 0.4;
          } else if (curCpuHand === 'SCISSORS') {
            // チョキ: 人差し指・中指伸ばし、他は折り曲げ
            f.index.rotation.x = 0;
            f.middle.rotation.x = 0;
            f.ring.rotation.x = Math.PI * 0.75;
            f.pinky.rotation.x = Math.PI * 0.75;
            f.thumb.rotation.x = Math.PI * 0.4;
          } else if (curCpuHand === 'PAPER') {
            // パー: 全指完全伸長
            f.index.rotation.x = 0;
            f.middle.rotation.x = 0;
            f.ring.rotation.x = 0;
            f.pinky.rotation.x = 0;
            f.thumb.rotation.x = 0;
          }
        } else {
          // IDLE 状態: 自然な腕下げ待機ポーズ
          rightArmGroupRef.current.rotation.x = Math.sin(elapsedTime * 1.5) * 0.05;
          rightArmGroupRef.current.rotation.z = -0.15;
        }
      }

      // (C) 勝敗結果に応じた表情と頭部ポーズ変化
      if (headGroupRef.current && eyeLeftMeshRef.current && eyeRightMeshRef.current && mouthMeshRef.current) {
        if (curStage === 'RESULT') {
          if (curResult === 'WIN') {
            // プレイヤー勝利 ＝ 女の子敗北（悔しい・ショックポーズ）
            headGroupRef.current.rotation.x = 0.25;
            headGroupRef.current.rotation.z = -0.1;
            eyeLeftMeshRef.current.scale.set(1, 0.2, 1);
            eyeRightMeshRef.current.scale.set(1, 0.2, 1);
            mouthMeshRef.current.rotation.z = 0;
          } else if (curResult === 'LOSE') {
            // プレイヤー敗北 ＝ 女の子勝利（大喜び笑顔ポーズ）
            headGroupRef.current.rotation.x = -0.15;
            headGroupRef.current.rotation.z = Math.sin(elapsedTime * 6) * 0.08;
            eyeLeftMeshRef.current.scale.set(1, 0.8, 1);
            eyeRightMeshRef.current.scale.set(1, 0.8, 1);
            mouthMeshRef.current.rotation.z = Math.PI;
          } else if (curResult === 'DRAW') {
            // 引き分け（首を傾げるポーズ）
            headGroupRef.current.rotation.x = 0;
            headGroupRef.current.rotation.z = 0.25;
            eyeLeftMeshRef.current.scale.set(1.2, 1.2, 1);
            eyeRightMeshRef.current.scale.set(1.2, 1.2, 1);
            mouthMeshRef.current.rotation.z = Math.PI * 0.5;
          }
        } else {
          // 通常表情に復帰
          headGroupRef.current.rotation.set(0, 0, 0);
          eyeLeftMeshRef.current.scale.set(1, 1, 1);
          eyeRightMeshRef.current.scale.set(1, 1, 1);
          mouthMeshRef.current.rotation.z = Math.PI;
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    // 7. リサイズ監視 (ResizeObserver)
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(container);

    // 8. クリーンアップ処理
    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      if (rendererRef.current && rendererRef.current.domElement) {
        rendererRef.current.dispose();
        if (container.contains(rendererRef.current.domElement)) {
          container.removeChild(rendererRef.current.domElement);
        }
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="girl-3d-avatar-container"
      style={{
        width: '100%',
        height: '240px',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '16px',
      }}
    />
  );
};
