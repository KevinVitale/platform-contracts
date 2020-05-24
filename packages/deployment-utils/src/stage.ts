
export abstract class DeploymentStage {
  constructor(privateKey: string, rpcUrl: string, networkId: number) {}

  async deploy(
    findInstance: (name: string) => Promise<string>,
    onDeployment: (name: string, address: string, dependency: boolean) => void,
    transferOwnership: (address: string) => void,
  ) {}
}
