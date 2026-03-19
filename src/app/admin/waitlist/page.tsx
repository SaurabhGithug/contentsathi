"use client";

import { useEffect, useState } from "react";

export default function WaitlistViewer() {
  const [waitlist, setWaitlist] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/waitlist/view")
      .then((res) => res.json())
      .then((data) => {
        setWaitlist(data.waitlist || []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="p-10 font-sans">
      <h1 className="text-2xl font-bold mb-6">Waitlist Details</h1>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <table className="min-w-full border">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2 text-left">Email</th>
              <th className="border p-2 text-left">Joined At</th>
            </tr>
          </thead>
          <tbody>
            {waitlist.map((entry) => (
              <tr key={entry.id}>
                <td className="border p-2">{entry.email}</td>
                <td className="border p-2">{new Date(entry.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
