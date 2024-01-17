import { DataAwsIamPolicyDocument } from "@cdktf/provider-aws/lib/data-aws-iam-policy-document";
import { IamRole } from "@cdktf/provider-aws/lib/iam-role";
import { ActionsSecret } from "@cdktf/provider-github/lib/actions-secret";
import { Repository } from "@cdktf/provider-github/lib/repository";
import { Construct } from "constructs";

type GithubRepositoryWithActionsAwsOidcProps = {
  oidcProviderArn: string;
  repositoryName: string;
  repositoryDescription: string;
  repositoryBranchNane: string;
  githubActionsSecretName?: string;
};

export class GithubRepositoryWithActionsAwsOidc extends Construct {
  constructor(
    scope: Construct,
    id: string,
    props: GithubRepositoryWithActionsAwsOidcProps
  ) {
    super(scope, id);

    // Github Repository
    const repository = new Repository(this, "Repository", {
      name: props.repositoryName,
      description: props.repositoryDescription,
      visibility: "private",
    });

    // IAM Role
    const assumeRolePolicyDoc = new DataAwsIamPolicyDocument(
      this,
      "AwsOidcAssumeRolePolicy",
      {
        statement: [
          {
            effect: "Allow",
            principals: [
              {
                type: "Federated",
                identifiers: [props.oidcProviderArn],
              },
            ],
            actions: ["sts:AssumeRoleWithWebIdentity"],
            condition: [
              {
                test: "StringEquals",
                variable: "token.actions.githubusercontent.com:aud",
                values: ["sts.amazonaws.com"],
              },
              {
                test: "StringEquals",
                variable: "token.actions.githubusercontent.com:sub",
                values: [
                  `repo:${repository.fullName}:ref:refs/heads/${props.repositoryBranchNane}`,
                ],
              },
            ],
          },
        ],
      }
    );
    const oidcRole = new IamRole(this, "AwsOidcRole", {
      name: "sample-github-actions-role",
      assumeRolePolicy: assumeRolePolicyDoc.json,
      managedPolicyArns: ["arn:aws:iam::aws:policy/AdministratorAccess"],
    });

    // Github Actions Secret
    new ActionsSecret(this, "ActionsEnvSecret", {
      repository: repository.name,
      secretName: props.githubActionsSecretName || "AWS_OIDC_ROLE_ARN",
      plaintextValue: oidcRole.arn,
    });
  }
}
