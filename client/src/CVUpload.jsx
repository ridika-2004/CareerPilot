import { useState } from 'react';
import axios from 'axios';

const API = 'http://localhost:8000/api/cv';

export default function CVUpload({ userId }) {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('');
  const [result, setResult] = useState(null);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState(null);
  const [asking, setAsking] = useState(false);

  const handleUpload = async () => {
    if (!file) return;
    setStatus('Processing your CV...');
    setResult(null);

    const formData = new FormData();
    formData.append('cv', file);
    formData.append('user_id', userId);

    try {
      const res = await axios.post(`${API}/upload/`, formData);
      setResult(res.data);
      setStatus('');
    } catch (err) {
      setStatus('Error: ' + (err.response?.data?.error || 'Upload failed'));
    }
  };

  const handleAsk = async () => {
    if (!question.trim()) return;
    setAsking(true);
    setAnswer(null);
    try {
      const res = await axios.post(`${API}/ask/`, {
        user_id: userId,
        question,
      });
      setAnswer(res.data);
    } catch (err) {
      setAnswer({ answer: 'Error: ' + err.response?.data?.error });
    } finally {
      setAsking(false);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: 24 }}>
      <h2>Upload Your CV</h2>

      <input
        type="file"
        accept=".pdf,.doc,.docx"
        onChange={e => setFile(e.target.files[0])}
      />
      <button onClick={handleUpload} disabled={!file}>
        Upload & Process
      </button>

      {status && <p>{status}</p>}

      {result && (
        <div style={{ background: '#fafafa', padding: 12, borderRadius: 8, border: '1px solid #e5e5e5' }}>
          <p>{result.chunks_stored} chunks stored</p>
          <p>Sections: {result.sections.join(', ')}</p>
        </div>
      )}

      {result && (
        <div style={{ marginTop: 32 }}>
          <h3>Ask about your CV</h3>
          <input
            style={{ width: '100%', padding: 8 }}
            placeholder="Am I ready for a data engineer role?"
            value={question}
            onChange={e => setQuestion(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAsk()}
          />
          <button onClick={handleAsk} disabled={asking}>
            {asking ? 'Thinking...' : 'Ask'}
          </button>

          {answer && (
            <div style={{ background: '#f5f5f5', padding: 12, marginTop: 12, borderRadius: 8 }}>
              <p>{answer.answer}</p>
              {answer.source_sections && (
                <small>Sources: {answer.source_sections.join(', ')}</small>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}