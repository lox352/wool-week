import { useState } from "react";
import { downloadBackup, parseBackup, restoreBackup } from "../helpers/backups";
import { getStorageNotice, type Project } from "../helpers/projects";
import Dialog from "./ui/Dialog";

export default function ProjectBackup() {
  const [pending, setPending] = useState<Project[]>();
  const [message, setMessage] = useState("");
  return <section className="screen-only" aria-label="Project backups">
    <p>Keep a backup to move between devices or recover after clearing browser data.</p>
    <button type="button" onClick={downloadBackup}>Export project backup</button>{" "}
    <label>Import project backup <input type="file" accept=".json,application/json" onChange={async event => {
      const file = event.target.files?.[0];
      event.target.value = "";
      if (!file) return;
      try {
        if (file.size > 2_000_000) throw new Error("Backup is too large (maximum 2 MB).");
        setPending(parseBackup(await file.text()));
        setMessage("");
      } catch (error) { setMessage(error instanceof Error ? error.message : "Could not read backup."); }
    }} /></label>
    <p role="status">{message}</p>
    {pending && <Dialog open title="Restore project backup?"
      text={`Add ${pending.length} projects as separate copies? Your existing projects will not be replaced.`}
      confirmLabel="Restore copies" onCancel={() => setPending(undefined)} onConfirm={() => {
        restoreBackup(pending);
        setMessage(getStorageNotice() || `Restored ${pending.length} project copies.`);
        setPending(undefined);
      }} />}
  </section>;
}
