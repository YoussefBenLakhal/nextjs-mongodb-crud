'use client';
import { clientLogout } from '@/lib/client-auth';
import { useState } from 'react';

export default function ClientDashboard({ session }) {
  const [formData, setFormData] = useState({
    studentEmail: '',
    course: 'Mathématiques',
    grade: '',
    absenceCount: 0
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (!formData.studentEmail) throw new Error("L'email étudiant est requis");
      
      let endpoint = '';
      let body = {};

      if (formData.grade) {
        endpoint = '/api/grades';
        body = {
          studentEmail: formData.studentEmail,
          course: formData.course,
          grade: parseFloat(formData.grade)
        };
      } else if (formData.absenceCount > 0) {
        endpoint = '/api/absences';
        body = {
          studentEmail: formData.studentEmail,
          course: formData.course,
          count: formData.absenceCount
        };
      } else {
        throw new Error("Remplissez soit la note soit le nombre d'absences");
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!response.ok) throw new Error(await response.text());

      setFormData({ 
        ...formData, 
        grade: '', 
        absenceCount: 0 
      });
      alert('Enregistrement réussi !');

    } catch (error) {
      alert(`Erreur: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex-shrink-0 flex items-center">
              <span className="text-xl font-bold text-blue-600">EduPlatform</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-600">{session.email}</span>
              <button
                onClick={clientLogout}
                className="text-gray-600 hover:text-blue-600 transition-colors"
              >
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="py-10">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Tableau de bord Enseignant</h1>
            
            <div className="bg-gray-50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-6">➕ Ajouter une évaluation</h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="email"
                    placeholder="Email étudiant"
                    className="p-2 border rounded focus:ring-2 focus:ring-blue-500"
                    value={formData.studentEmail}
                    onChange={e => setFormData({...formData, studentEmail: e.target.value})}
                    required
                  />

                  <select
                    className="p-2 border rounded focus:ring-2 focus:ring-blue-500"
                    value={formData.course}
                    onChange={e => setFormData({...formData, course: e.target.value})}
                  >
                    <option>Mathématiques</option>
                    <option>Physique</option>
                    <option>Informatique</option>
                  </select>

                  <input
                    type="number"
                    placeholder="Note (0-20)"
                    className="p-2 border rounded focus:ring-2 focus:ring-blue-500"
                    min="0"
                    max="20"
                    step="0.5"
                    value={formData.grade}
                    onChange={e => setFormData({...formData, grade: e.target.value})}
                  />

                  <input
                    type="number"
                    placeholder="Nombre d'absences"
                    className="p-2 border rounded focus:ring-2 focus:ring-blue-500"
                    min="0"
                    value={formData.absenceCount}
                    onChange={e => setFormData({...formData, absenceCount: Math.max(0, parseInt(e.target.value) || 0)})}
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Valider
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}