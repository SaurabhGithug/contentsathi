import { useState, useEffect } from "react";
import { X, Send, AlertCircle, CheckCircle2, Loader2, Link as LinkIcon, Edit2, Globe } from "lucide-react";
import toast from "react-hot-toast";

interface PublishModalProps {
  post: {
    title?: string;
    body: string;
    platform: string;
    imageUrl?: string;
    id?: string; // calendarItemId if already scheduled
  };
  onClose: () => void;
  onSuccess?: (url: string) => void;
}

export default function PublishModal({ post, onClose, onSuccess }: PublishModalProps) {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [postUrl, setPostUrl] = useState("");
  
  const [editedText, setEditedText] = useState(post.body);
  const [imageUrl, setImageUrl] = useState(post.imageUrl || "");

  useEffect(() => {
    async function loadAccounts() {
      try {
        const res = await fetch("/api/social-accounts");
        if (!res.ok) throw new Error("Failed to load accounts");
        const data = await res.json();
        // Filter accounts to match the post's platform
        // Handle variations like "youtube shorts" -> "youtube", "x (twitter)" -> "x"
        let normPlatform = post.platform.toLowerCase();
        if (normPlatform.includes("youtube")) normPlatform = "youtube";
        if (normPlatform.includes("twitter") || normPlatform === "x") normPlatform = "x";
        
        const matchedAccounts = data.filter((a: any) => a.platform === normPlatform);
        setAccounts(matchedAccounts);
      } catch (err) {
        setError("Could not load connected accounts.");
      } finally {
        setLoading(false);
      }
    }
    loadAccounts();
  }, [post.platform]);

  const handlePublish = async () => {
    if (accounts.length === 0) {
      setError(`No ${post.platform} account connected. Please connect one in Settings.`);
      return;
    }

    setPublishing(true);
    setError("");
    setSuccess("");

    let apiRoute = "";
    const p = post.platform.toLowerCase();
    if (p.includes("instagram")) apiRoute = "/api/publish/instagram";
    else if (p.includes("linkedin")) apiRoute = "/api/publish/linkedin";
    else if (p.includes("youtube")) apiRoute = "/api/publish/youtube";
    else if (p.includes("twitter") || p === "x") apiRoute = "/api/publish/x";
    else if (p.includes("facebook")) apiRoute = "/api/publish/facebook";
    else if (p.includes("whatsapp")) apiRoute = "/api/publish/whatsapp";

    if (!apiRoute) {
      setError(`Publishing not supported for ${post.platform}.`);
      setPublishing(false);
      return;
    }

    try {
      const res = await fetch(apiRoute, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body: editedText,
          postText: editedText, // Keep postText for other platforms that might expect it
          imageUrl,
          calendarItemId: post.id,
          // Extra payload for LinkedIn/YouTube/WhatsApp
          title: post.title || "Post Title",
          description: editedText,
          message: editedText,
          isShorts: p.includes("shorts"),
          accessToken: accounts[0]?.accessToken,
          providerAccountId: accounts[0]?.accountId,
          pageId: accounts[0]?.pageId, // for facebook
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Publish failed");

      setSuccess("Post published successfully!");
      toast.success("Post saved! ✅");
      const liveUrl = data.platformPostUrl || data.postUrl || data.tweetUrl || data.url;
      if (liveUrl) {
        setPostUrl(liveUrl);
      }
      if (onSuccess) onSuccess(liveUrl);
      
      // Auto-close after 5s if successful without URL (give user time to read)
      if (!liveUrl) {
        setTimeout(onClose, 2500);
      }
    } catch (err: any) {
      toast.error('Kuch toh gadbad hai — try again 🙏');
      setError(err.message || "An unexpected error occurred during publishing.");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Publish Now</h3>
            <p className="text-xs text-gray-500 font-medium">{post.platform} • {accounts.length > 0 ? accounts[0].accountName : "Account required"}</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin mb-4 text-indigo-500" />
              <p className="text-sm font-medium">Checking account status...</p>
            </div>
          ) : accounts.length === 0 ? (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 text-amber-800">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <div className="text-sm">
                <p className="font-bold mb-1">Account not connected</p>
                <p>You need to connect your {post.platform} account in Settings before you can publish directly.</p>
              </div>
            </div>
          ) : (
            <>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium flex gap-2 items-start">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <p>{error}</p>
                </div>
              )}
              
              {success && (
                <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-4 rounded-xl text-sm flex flex-col items-center justify-center text-center">
                  <CheckCircle2 className="w-8 h-8 shrink-0 mb-3 text-green-600" />
                  <p className="font-bold text-lg mb-1">{success}</p>
                  
                  {postUrl ? (
                    <a href={postUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 px-5 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors shadow-sm">
                      <LinkIcon className="w-4 h-4" /> View Live Post
                    </a>
                  ) : (
                    <p className="text-green-600 font-medium">Platform processed the request.</p>
                  )}
                </div>
              )}

              {!success && (
                <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700 flex items-center justify-between">
                      Post Content
                      <Edit2 className="w-3.5 h-3.5 text-gray-400" />
                    </label>
                    <textarea 
                      value={editedText}
                      onChange={(e) => setEditedText(e.target.value)}
                      className="w-full h-40 p-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all text-sm resize-none"
                    />
                  </div>
                  
                  {imageUrl && (
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-gray-700">Attached Media</label>
                      <div className="relative rounded-xl overflow-hidden border border-gray-200 w-full h-32 bg-gray-100 flex items-center justify-center">
                        <img src={imageUrl} alt="Attachment preview" className="object-cover w-full h-full" />
                        <button 
                          onClick={() => setImageUrl("")}
                          className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors backdrop-blur-sm"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

        </div>

        {/* Footer */}
        {!success && accounts.length > 0 && (
          <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
            <button
              onClick={onClose}
              disabled={publishing}
              className="px-5 py-2.5 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handlePublish}
              disabled={publishing || !editedText.trim()}
              className="px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
            >
              {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Publish Now
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
