import {useVerifyEmail} from "../../../features/auth/hooks/useVerifyEmail.ts";


export default function VerifyPage() {
    useVerifyEmail();

    return <p>Verifying your email, please login...</p>;
}
