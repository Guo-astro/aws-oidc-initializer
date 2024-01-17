import { Construct } from "constructs";
import { App, TerraformStack } from "cdktf";
import { DockerProvider } from "@cdktf/provider-docker/lib/provider";
import { Image } from "@cdktf/provider-docker/lib/image";
import { Container } from "@cdktf/provider-docker/lib/container";
import { AwsProvider } from "@cdktf/provider-aws/lib/provider";
import { GithubProvider } from "@cdktf/provider-github/lib/provider";
import { AwsOidcProvider } from "./lib/aws-oidc-provider";
import { GithubRepositoryWithActionsAwsOidc } from "./lib/github-repository-with-actions-aws-oidc";

// class MyStack extends TerraformStack {
  constructor(scope: Construct, name: string) {
    super(scope, name);

    new DockerProvider(this, "docker", {});

    const dockerImage = new Image(this, "nginxImage", {
      name: "nginx:latest",
      keepLocally: false,
    });

    new Container(this, "nginxContainer", {
      name: "tutorial",
      image: dockerImage.name,
      ports: [
        {
          internal: 80,
          external: 8000,
        },
      ],
    });
  }
// }
class GithubActionsCDKPipeline extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Github Provider
    new GithubProvider(this, "Github", {
      token: process.env.GITHUB_TOKEN,
    });

    // AWS Provider
    new AwsProvider(this, "AWS");

    const oidcProvider = new AwsOidcProvider(this, "AwsOidcProvider");

    new GithubRepositoryWithActionsAwsOidc(this, "Resources", {
      repositoryName: "cdktf-template",
      repositoryDescription: "sample repository",
      repositoryBranchNane: "main",
      oidcProviderArn: oidcProvider.oidcProviderArn,
    });
  }
}

const app = new App();
// new MyStack(app, "cdktf-docker-example");
new GithubActionsCDKPipeline(app, "cdktf-github-actions-cicd-sample");
app.synth();
