"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, ExternalLink } from 'lucide-react';

export default function GenerateLink() {
  const [expediente, setExpediente] = useState('');
  const [generatedUrl, setGeneratedUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateLink = async () => {
    if (!expediente.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/generate-unique-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expediente: expediente.trim() }),
      });

      if (response.ok) {
        const data = await response.json();
        setGeneratedUrl(data.url);
      } else {
        alert('Error al generar el enlace');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al generar el enlace');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copiando:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-t from-[#008606] to-black py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-white/20"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">
            Generar Enlace Único
          </h1>
          <p className="text-gray-600 text-center mb-8">
            Crea un enlace personalizado para cada expediente
          </p>

          <div className="space-y-6">
            <div>
              <label htmlFor="expediente" className="block text-sm font-medium text-gray-700 mb-2">
                Número de Expediente *
              </label>
              <input
                type="text"
                id="expediente"
                value={expediente}
                onChange={(e) => setExpediente(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-green-200 focus:border-green-400 transition-all duration-200"
                placeholder="Ej: 25643004"
              />
            </div>

            <button
              onClick={generateLink}
              disabled={!expediente.trim() || isLoading}
              className="w-full bg-[#008606] hover:bg-[#008606]/90 disabled:bg-gray-300 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              {isLoading ? 'Generando...' : 'Generar Enlace'}
            </button>

            {generatedUrl && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-green-50 border border-green-200 rounded-xl p-4"
              >
                <h3 className="font-semibold text-green-800 mb-2">Enlace Generado:</h3>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={generatedUrl}
                    readOnly
                    className="flex-1 px-3 py-2 bg-white border border-green-300 rounded-lg text-sm"
                  />
                  <button
                    onClick={copyToClipboard}
                    className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                    title="Copiar enlace"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <a 
                    href={generatedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    title="Abrir enlace"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
                {copied && (
                  <p className="text-green-600 text-sm mt-2">¡Enlace copiado!</p>
                )}
              </motion.div>
            )}
          </div>

          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <h4 className="font-semibold text-blue-800 mb-2">¿Cómo funciona?</h4>
            <ul className="text-blue-700 text-sm space-y-1">
              <li>• Cada expediente tiene un enlace único</li>
              <li>• El cliente puede completar/editar su solicitud</li>
              <li>• Los datos se sincronizan automáticamente en el sistema</li>
              <li>• Solo se actualiza el registro del expediente específico</li>
            </ul>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
