/// <reference types="react-scripts" />

// Este trecho avisa ao TypeScript sobre a existência do window.ethereum
interface Window {
  ethereum?: any;
}