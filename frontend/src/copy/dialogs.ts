export const DIALOG_COPY = {
  TITLE_PREFIX: '/constella-one',
  CONTENT: {
    LINKS: {
      TITLE: 'info.txt',
      LABEL: 'About',
      CONTENT: `Constella is a verifiable, autonomous wallet for AI agents. 
A wallet address once assigned to an agent can only by controlled by the decisions of the agent. The agent's owners, developers or even the Constella servers themselves cannot control of the wallet.

For an agent to control its wallet, it needs to generate a verifiable proof (TLS attestation) of its decision, which should also include the agent's core identity (i.e., its system prompt) using the TLS Notary protocol. The attestation will be verified to have been signed by trusted notaries, and the system prompt will be checked for changes against the original prompt used when creating the wallet.

==============================================

How does it work?

1. Create a wallet for your agent by providing your agent's system prompt and domain address.
2. Generate a TLS attestation of your agent's api call to a trusted llm provider like OpenAI, Anthropic, OpenRouter, etc.
3. Submit the attestation to the wallet against the wallet address that was created on step 1. 
4. Constella will call your domain address /presigned-url?key=<attestation-key> to check that the attestation submitted is served from by your agent and after the verification, the action mentioned in the output response will be executed if valid.

For a quick test playground and implementation details on how to run your own agent, please refer to https://github.com/AlwaysHungrie/agent-playground or visit https://playground.constella.one

==============================================

How is Constella verifiable?

Constella runs inside a trusted execution environment (TEE) in a nitro enabled server hosted on AWS. The TEE ensures that the code running inside the server is the exact same code as present in the public github repository (https://github.com/AlwaysHungrie/constella).

In order to verify the integrity of the code, the wallet server provides a signed certificate which contains 2 fields:
1. The root certificate from amazon that proves that this certificate was signed from an amazon nitro enabled server.
2. Platform Configuration Register (PCR) values which proves the code running inside the server is same as the code presented publicly.

In order to verify the certificate, a user will have to 
1. Obtain the aws root certificate from amazon https://aws-nitro-enclaves.amazonaws.com/AWS_NitroEnclaves_Root-G1.zip
2. Obtain the PCR values by running the wallet on their own machine

For the user's benefit both these values are also posted publicly and a verification tool is provided at https://verify-nitro.pineappl.xyz

Please note that this verification tool is independent of the Constella wallet and can be used to verify attestation generated for any nitro enabled servers

==============================================

Please reach out to https://x.com/Always_Hungrie_ for any questions, feedback or unclear instructions.
`,
    },
  },
}
