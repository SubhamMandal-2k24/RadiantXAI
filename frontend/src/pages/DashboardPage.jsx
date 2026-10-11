import { useState } from "react";
import { ResultsPage } from "./ResultsPage";
import { UploadPage } from "./UploadPage";
export function DashboardPage() {
    const [result, setResult] = useState(null);
    return result ? (<ResultsPage result={result} onReset={() => setResult(null)}/>) : (<UploadPage onResult={setResult}/>);
}
