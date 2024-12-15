import { Environment } from "@react-three/drei";
import { Physics } from "@react-three/rapier";
import { useRef } from "react";
import { CharacterController } from "./CharacterController";
import { Map } from "./Map";

const maps = {
  ground3: {
    scale: 1,
    position: [-4, -6, -6],
  },
};

export const Experience = () => {
  const shadowCameraRef = useRef();

  const map = "ground3";

  return (
    <>
      <Environment preset="sunset" />
      <directionalLight
        intensity={0.65}
        castShadow
        position={[-15, 10, 15]}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.00005}
      >
      </directionalLight>
      <Physics key={map}>
        <Map
          scale={maps[map].scale}
          position={maps[map].position}
          model={`models/${map}.glb`}
        />
        <CharacterController />
      </Physics>
    </>
  );
};
