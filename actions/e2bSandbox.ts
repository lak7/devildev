// "use server";

// import { getSandbox } from '@/lib/utils';
// import { Sandbox } from '@e2b/code-interpreter'

// export async function getSandboxLink() {
//     const sandbox = await Sandbox.create("devil-nextjs-test");
//     const sandboxId = sandbox.sandboxId;
//     const url = await getSandbox(sandboxId);
//     const host =  url.getHost(3000);
//     return `https ://${host}`;
// }