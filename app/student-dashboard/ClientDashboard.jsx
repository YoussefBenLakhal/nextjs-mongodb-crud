'use client';
import { clientLogout } from '@/lib/client-auth';
import { useEffect, useState } from 'react';

export default function ClientDashboard({ session }) {
  const [grades, setGrades] = useState([]);
  const [absences, setAbsences] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [gradesRes, absencesRes] = await Promise.all([
          fetch(`/api/grades?studentId=${session.id}`),
          fetch(`/api/absences?studentId=${session.id}`)
        ]);

        if (!gradesRes.ok || !absencesRes.ok) throw new Error('Failed to fetch');
        
        const gradesData = await gradesRes.json();
        const absencesData = await absencesRes.json();

        setGrades(gradesData);
        setAbsences(absencesData);
      } catch (error) {
        console.error('Fetch error:', error);
      }
    };

    fetchData();
  }, [session.id]);

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
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Tableau de bord Étudiant</h1>
            
            <div className="space-y-8">
              <section>
                <h2 className="text-xl font-semibold mb-4">📚 Mes Notes</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {grades.map(grade => (
                    <div key={grade._id} className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex justify-between items-center">
                        <h3 className="font-medium">{grade.course}</h3>
                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                          {grade.grade}/20
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">
                        {new Date(grade.date).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  ))}
                  {grades.length === 0 && (
                    <p className="text-gray-500">Aucune note disponible</p>
                  )}
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">❌ Mes Absences</h2>
                <div className="space-y-3">
                  {absences.map(absence => (
                    <div key={absence._id} className="bg-red-50 p-4 rounded-lg flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{absence.course}</h3>
                        <p className="text-sm text-gray-600">
                          {new Date(absence.date).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm">
                        Absence
                      </span>
                    </div>
                  ))}
                  {absences.length === 0 && (
                    <p className="text-gray-500">Aucune absence enregistrée</p>
                  )}
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}