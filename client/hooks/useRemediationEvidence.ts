import { useState, useEffect, useCallback } from 'react';
import { GapRemediation } from '@/lib/gapRemediationTypes';

export interface EvidenceItem {
  id: string;
  title: string;
  type: string;
  nistCategory: string;
  status: string;
  uploadedBy: string;
  date: string;
  expiryDate: string | null;
  tags: string[];
  fileName: string;
  fileSize: number;
  remediation: GapRemediation;
}

const isLocalStorageAvailable = (): boolean => {
  try {
    if (typeof window === 'undefined') return false;
    const test = '__test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
};

export const useRemediationEvidence = () => {
  const [remediations, setRemediations] = useState<GapRemediation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRemediations = useCallback(() => {
    if (!isLocalStorageAvailable()) return;

    setLoading(true);
    setError(null);

    try {
      const stored = localStorage.getItem('gap_remediation_data');

      if (!stored) {
        console.log('📁 useRemediationEvidence: No remediation data in localStorage');
        setRemediations([]);
        return;
      }

      const data = JSON.parse(stored);

      const remediationsList: GapRemediation[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.remediations)
          ? data.remediations
          : typeof data === 'object' && data !== null
            ? Object.values(data)
            : [];

      const totalWithFiles = remediationsList.filter(
        (r: any) => Array.isArray(r?.evidenceFiles) && r.evidenceFiles.length > 0
      ).length;

      const totalFiles = remediationsList.reduce((sum: number, r: any) => {
        return sum + (Array.isArray(r?.evidenceFiles) ? r.evidenceFiles.length : 0);
      }, 0);

      console.log(
        `📁 useRemediationEvidence loaded: ${remediationsList.length} remediations, ${totalWithFiles} have files, ${totalFiles} total files`
      );

      setRemediations(remediationsList);
    } catch (err) {
      console.error('Failed to load remediations:', err);
      setError('Failed to load remediation data');
      setRemediations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isLocalStorageAvailable()) return;

    loadRemediations();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'gap_remediation_data') {
        console.log('📁 Storage changed for gap_remediation_data, reloading remediations');
        loadRemediations();
      }
    };

    const handleCustomEvent = () => {
      console.log('📁 gapRemediationDataChanged event detected, reloading remediations');
      loadRemediations();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('gapRemediationDataChanged', handleCustomEvent);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('gapRemediationDataChanged', handleCustomEvent);
    };
  }, [loadRemediations]);

  const getEvidenceItems = useCallback((): EvidenceItem[] => {
    const items: EvidenceItem[] = [];

    remediations.forEach((remediation) => {
      if (Array.isArray(remediation.evidenceFiles) && remediation.evidenceFiles.length > 0) {
        remediation.evidenceFiles.forEach((file, index) => {
          const expiryDate = new Date();
          expiryDate.setFullYear(expiryDate.getFullYear() + 1);

          items.push({
            id: `${remediation.questionId}-${index}`,
            title: file.name,
            type: 'Remediation Evidence',
            nistCategory: remediation.nistId,
            status: remediation.status === 'Treated' ? 'Approved' : 'Under Review',
            uploadedBy: 'User',
            date: new Date(file.uploadedAt).toLocaleDateString(),
            expiryDate: expiryDate.toISOString().split('T')[0],
            tags: [remediation.function, remediation.nistId, 'Remediation', remediation.priority],
            fileName: file.name,
            fileSize: file.size,
            remediation,
          });
        });
      }
    });

    return items;
  }, [remediations]);

  const getEvidenceByFunction = useCallback(
    (func: string): EvidenceItem[] => {
      return getEvidenceItems().filter((item) => item.nistCategory.startsWith(func));
    },
    [getEvidenceItems]
  );

  const getEvidenceGaps = useCallback(() => {
    return remediations
      .filter((r) => !Array.isArray(r.evidenceFiles) || r.evidenceFiles.length === 0)
      .map((r) => ({
        category: r.nistId,
        name: r.question,
        items: 0,
      }));
  }, [remediations]);

  return {
    remediations,
    loading,
    error,
    getEvidenceItems,
    getEvidenceByFunction,
    getEvidenceGaps,
  };
};