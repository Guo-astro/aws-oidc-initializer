import { dataTlsCertificate } from "@cdktf/provider-tls";
import { TlsProvider } from "@cdktf/provider-tls/lib/provider";
import { IamOpenidConnectProvider } from "@cdktf/provider-aws/lib/iam-openid-connect-provider";

import { Construct } from "constructs";

export class AwsOidcProvider extends Construct {
  readonly oidcProviderArn: string;
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // TLS Provider
    new TlsProvider(this, "TLS");

    // IAM OIDC Provider
    const githubCert = new dataTlsCertificate.DataTlsCertificate(
      this,
      "GithubCertificate",
      {
        url: "https://token.actions.githubusercontent.com/.well-known/openid-configuration",
      }
    );
    const oidcProvider = new IamOpenidConnectProvider(this, "AwsOidcProvider", {
      url: "https://token.actions.githubusercontent.com",
      clientIdList: ["sts.amazonaws.com"],
      thumbprintList: [githubCert.certificates.get(0).sha1Fingerprint],
    });
    this.oidcProviderArn = oidcProvider.arn;
  }
}
