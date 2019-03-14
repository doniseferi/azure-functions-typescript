import { spawnSync } from "child_process";

interface ResourceInfo {
  name: string;
}

export class TestHelper {
  private static memoizedApiRootUrl: string;

  public static get apiRootUrl(): string {
    if (this.memoizedApiRootUrl === undefined) {
      this.memoizedApiRootUrl = this.getApiRootUrl();
    }

    return this.memoizedApiRootUrl;
  }

  private static getApiRootUrl(): string {
    const currentBranchName = this.runShellCommand(
      "git symbolic-ref --short HEAD"
    ).trim();
    const resourceGroupName = `azure-functions-typescript-${currentBranchName}`;
    const resourcesInfo = this.runShellCommand(
      `az resource list --resource-group ${resourceGroupName}`
    );
    const resourceInfos = JSON.parse(resourcesInfo) as Array<ResourceInfo>;
    const functionsResourceName = resourceInfos
      .map(resourceInfo => resourceInfo.name)
      .find(
        resourceName => resourceName.match(/^aft-(.*)-functions$/) !== null
      );

    if (functionsResourceName === undefined) {
      throw new Error(
        `Could not a functions resources in the resource group '${resourceGroupName}'.`
      );
    }

    return `https://${functionsResourceName}.azurewebsites.net/api`;
  }

  private static runShellCommand(commandAndArguments: string): string {
    const [command, ...args] = commandAndArguments.split(" ");
    const response = spawnSync(command, args);

    if (response.stdout === null) {
      let errorMessage = `Error running '${command}'`;
      if (response.stderr !== null) {
        errorMessage += `: ${response.stderr}`;
      }
      errorMessage += ".";

      throw new Error(errorMessage);
    }

    return response.stdout.toString();
  }
}
