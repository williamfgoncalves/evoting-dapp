import { ethers } from "ethers";
import { ElectionFactoryABI, ElectionABI, FACTORY_ADDRESS } from "../contracts";

export function getFactory(signerOrProvider: ethers.Signer | ethers.Provider) {
  return new ethers.Contract(FACTORY_ADDRESS, ElectionFactoryABI, signerOrProvider);
}

export function getElection(address: string, signerOrProvider: ethers.Signer | ethers.Provider) {
  return new ethers.Contract(address, ElectionABI, signerOrProvider);
}

export async function fetchAllElections(provider: ethers.Provider) {
  const factory = getFactory(provider);
  const addresses: string[] = await factory.getElections();
  return addresses;
}

export async function fetchElectionDetails(provider: ethers.Provider, address: string) {
  const election = getElection(address, provider);
  const [name, description, startTime, endTime] = await Promise.all([
    election.name(),
    election.description(),
    election.startTime(),
    election.endTime(),
  ]);
  const options: string[] = await election.getOptions();
  const isOpen: boolean = await election.isOpen();
  const hasEnded: boolean = await election.hasEnded();
  return {
    address,
    name,
    description,
    startTime: Number(startTime),
    endTime: Number(endTime),
    options,
    isOpen,
    hasEnded,
  };
}

export async function createElection(
  signer: ethers.Signer,
  data: {
    name: string;
    description: string;
    startTime: number;
    endTime: number;
    options: string[];
  }
) {
  const factory = getFactory(signer);
  const tx = await factory.createElection(
    data.name,
    data.description,
    data.startTime,
    data.endTime,
    data.options,
    false,
    1,
    false
  );
  return tx.wait();
}

export async function voteOnce(signer: ethers.Signer, electionAddress: string, optionIndex: number) {
  const election = getElection(electionAddress, signer);
  const tx = await election.vote(optionIndex);
  return tx.wait();
}

export async function fetchResults(provider: ethers.Provider, electionAddress: string) {
  const election = getElection(electionAddress, provider);
  const res: bigint[] = await election.getResults(); // reverte se antes do fim
  return res.map(n => Number(n));
}