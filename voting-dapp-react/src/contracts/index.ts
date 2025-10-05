// src/contracts/index.ts
import FactoryArtifact from "../abis/ElectionFactory.json";
import ElectionArtifact from "../abis/Election.json";

export const ElectionFactoryABI = FactoryArtifact.abi;
export const ElectionABI = ElectionArtifact.abi;

// Endereço do factory após migrate (ajuste conforme seu deploy)
export const FACTORY_ADDRESS = "0x91d42d9c8d69B4F49ae3044a88A16fa8F445f654"; // cole aqui o address do migrate