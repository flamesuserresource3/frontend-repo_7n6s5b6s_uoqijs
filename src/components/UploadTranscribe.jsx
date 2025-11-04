import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Upload, Download, FileAudio, History } from 'lucide-react';

const MODELS = [
  { id: 'whisper-tiny', label: 'Whisper Tiny' },
  { id: 'whisper-base', label: 'Whisper Base' },
  { id: 'whisper-small', label: 'Whisper Small' },
  { id: 'whisper-medium', label: 'Whisper Medium' },
  { id: 'whisper-large', label: 'Whisper Large' },
];

const LANGUAGES = [
  { id: 'auto', label: 'Auto-detect' },
  { id: 'en', label: 'English' },
  { id: 'es', label: 'Spanish' },
  { id: 'fr', label: 'French' },
  { id: 'de', label: 'German' },
  { id: 'it', label: 'Italian' },
  { id: 'pt', label: 'Portuguese' },
  { id: 'hi', label: 'Hindi' },
  { id: 'zh', label: 'Chinese' },
  { id: 'ja', label: 'Japanese' },
];

function bytesToMb(bytes) {
  return (bytes / (1024 * 1024)).toFixed(2);
}

function generateSRTFromText(text) {
  // Naive SRT generator: split into ~12-word chunks, 3s each
  const words = text.split(/\s+/).filter(Boolean);
  const chunks = [];
  const wordsPerChunk = 12;
  for (let i = 0; i < words.length; i += wordsPerChunk) {
    chunks.push(words.slice(i, i + wordsPerChunk).join(' '));
  }
  const toTimestamp = (seconds) => {
    const h = String(Math.floor(seconds / 3600)).padStart(2, '0');
    const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
    const s = String(Math.floor(seconds % 60)).padStart(2, '0');
    return `${h}:${m}:${s},000`;
  };
  return chunks
    .map((c, i) => `${i + 1}\n${toTimestamp(i * 3)} --> ${toTimestamp((i + 1) * 3)}\n${c}\n`)
    .join('\n');
}

export default function UploadTranscribe({ currentUser, onSaveHistory }) {
  const backendURL = import.meta.env.VITE_BACKEND_URL;
  const [file, setFile] = useState(null);
  const [selectedFilename, setSelectedFilename] = useState('');
  const [model, setModel] = useState(MODELS[2].id);
  const [language, setLanguage] = useState(LANGUAGES[0].id);
  const [progress, setProgress] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState('');
  const [transcription, setTranscription] = useState('');
  const [duration, setDuration] = useState(null);
  const audioRef = useRef(null);

  const accept = useMemo(() => ({ 'video/mp4': ['.mp4'], 'audio/mpeg': ['.mp3'], 'audio/wav': ['.wav'] }), []);

  useEffect(() => {
    const handler = (e) => {
      const item = e.detail;
      if (!item) return;
      setTranscription(item.text || '');
      if (item.model) setModel(item.model);
      if (item.language) setLanguage(item.language);
      setSelectedFilename(item.filename || 'transcription');
      setProgress(100);
    };
    window.addEventListener('aisubs_show_transcription', handler);
    return () => window.removeEventListener('aisubs_show_transcription', handler);
  }, []);

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    const audio = new Audio(url);
    audio.addEventListener('loadedmetadata', () => setDuration(audio.duration || null));
    audioRef.current = audio;
    setSelectedFilename(file.name);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const valid = ['video/mp4', 'audio/mpeg', 'audio/wav'];
    if (!valid.includes(f.type)) {
      setError('Unsupported file type. Use MP4, MP3, or WAV.');
      return;
    }
    setError('');
    setFile(f);
    setTranscription('');
    setProgress(0);
  };

  const simulateTranscription = async () => {
    setIsTranscribing(true);
    setError('');
    setProgress(0);
    // Simulate upload + processing progress
    for (let i = 0; i <= 100; i += 3) {
      await new Promise((r) => setTimeout(r, 60));
      setProgress(i);
    }
    const demoText =
      'This is a demo transcription. Connect your backend to get real results. The quick brown fox jumps over the lazy dog. AI subtitle generator creates accurate captions for your videos. Enjoy fast, reliable, and modern experience.';
    setTranscription(demoText);
    setIsTranscribing(false);
    const id = `demo_${Date.now()}`;
    onSaveHistory?.({ id, filename: file?.name || 'demo', model, language, createdAt: Date.now(), text: demoText });
  };

  const uploadAndTranscribe = async () => {
    if (!file) return;
    setIsTranscribing(true);
    setError('');
    setProgress(0);

    if (!backendURL) {
      await simulateTranscription();
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('model', model);
      formData.append('language', language);
      if (currentUser?.email) formData.append('email', currentUser.email);

      // Use XMLHttpRequest to show real upload progress
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${backendURL}/transcribe`);
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 50); // 0-50% for upload
          setProgress(percent);
        }
      };
      const xhrPromise = new Promise((resolve, reject) => {
        xhr.onreadystatechange = () => {
          if (xhr.readyState === 4) {
            if (xhr.status >= 200 && xhr.status < 300) resolve(xhr.responseText);
            else reject(new Error(xhr.responseText || 'Upload failed'));
          }
        };
        xhr.onerror = () => reject(new Error('Network error during upload'));
      });
      xhr.send(formData);

      // After upload completes, poll processing endpoint for progress if available
      let processProgress = 50;
      const tick = () => {
        processProgress = Math.min(100, processProgress + 5);
        setProgress(processProgress);
      };
      const pollTimer = setInterval(tick, 400);

      const responseText = await xhrPromise;
      let data;
      try { data = JSON.parse(responseText); } catch { data = { text: responseText }; }
      clearInterval(pollTimer);
      setProgress(100);

      const text = data.text || '';
      setTranscription(text);
      setIsTranscribing(false);
      const id = data.id || `job_${Date.now()}`;
      onSaveHistory?.({ id, filename: file.name, model, language, createdAt: Date.now(), text });
    } catch (err) {
      setIsTranscribing(false);
      setError(err.message || 'Transcription failed');
    }
  };

  const handleDownloadSRT = () => {
    const srt = generateSRTFromText(transcription || '');
    const blob = new Blob([srt], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(selectedFilename || file?.name || 'transcription').replace(/\.[^/.]+$/, '')}.srt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const isReady = !!file && !isTranscribing;

  return (
    <div className="w-full bg-white/5 border border-white/10 rounded-xl p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-white/10 flex items-center justify-center">
            <FileAudio className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-white font-semibold">Upload & Transcribe</h3>
            <p className="text-xs text-white/60">MP4, MP3, or WAV up to your plan limits</p>
          </div>
        </div>
        {(file || selectedFilename) && (
          <div className="text-xs text-white/60">
            Selected: <span className="text-white font-medium">{file?.name || selectedFilename}</span>
            {file ? <> • {bytesToMb(file.size)} MB</> : null}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-5 flex flex-col gap-3">
          <label className="block">
            <span className="text-sm text-white/70">Choose file</span>
            <input
              type="file"
              accept=".mp4,.mp3,.wav,video/mp4,audio/mpeg,audio/wav"
              onChange={handleFileChange}
              className="mt-1 w-full file:mr-4 file:rounded-lg file:border-0 file:bg-indigo-600 file:px-4 file:py-2 file:text-white file:cursor-pointer file:hover:bg-indigo-500 text-white bg-black/40 border border-white/10 rounded-lg"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-sm text-white/70">Model</span>
              <select
                className="mt-1 w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white"
                value={model}
                onChange={(e) => setModel(e.target.value)}
              >
                {MODELS.map((m) => (
                  <option key={m.id} value={m.id}>{m.label}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-sm text-white/70">Language</span>
              <select
                className="mt-1 w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                {LANGUAGES.map((l) => (
                  <option key={l.id} value={l.id}>{l.label}</option>
                ))}
              </select>
            </label>
          </div>
          <button
            onClick={uploadAndTranscribe}
            disabled={!isReady}
            className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border transition font-medium ${
              isReady ? 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-500' : 'bg-white/10 text-white/50 border-white/10 cursor-not-allowed'
            }`}
          >
            <Upload className="h-4 w-4" />
            {isTranscribing ? 'Processing…' : 'Start transcription'}
          </button>
          {error && <p className="text-sm text-red-300">{error}</p>}
        </div>

        <div className="md:col-span-7 flex flex-col gap-3">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-white/70">Progress</span>
              <span className="text-sm text-white/80">{Math.round(progress)}%</span>
            </div>
            <div className="w-full h-3 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="flex-1 min-h-[180px] max-h-72 overflow-auto rounded-lg border border-white/10 bg-black/40 p-3">
            {transcription ? (
              <pre className="whitespace-pre-wrap text-white/90 text-sm leading-relaxed">{transcription}</pre>
            ) : (
              <div className="h-full w-full text-white/50 text-sm flex items-center justify-center text-center px-6">
                Your transcription will appear here once ready.
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="text-xs text-white/60 flex items-center gap-2">
              <History className="h-4 w-4" />
              {duration ? `${Math.round(duration)}s duration` : 'Duration available after media loads'}
            </div>
            <button
              onClick={handleDownloadSRT}
              disabled={!transcription}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border transition font-medium ${
                transcription ? 'bg-white/10 hover:bg-white/20 text-white border-white/20' : 'bg-white/5 text-white/40 border-white/10 cursor-not-allowed'
              }`}
            >
              <Download className="h-4 w-4" />
              Download .srt
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
