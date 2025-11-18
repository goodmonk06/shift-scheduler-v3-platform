'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { api } from '@/lib/api';

export default function StaffPage() {
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStaff();
  }, []);

  const loadStaff = async () => {
    try {
      const data = await api.get('/staff');
      setStaff(data);
    } catch (error) {
      console.error('Failed to load staff:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>読み込み中...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">スタッフ管理</h1>
          <p className="text-muted-foreground">スタッフの登録・管理</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          スタッフ追加
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>スタッフ一覧 ({staff.length}名)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {staff.map((s) => (
              <div key={s.id} className="flex items-center justify-between border-b pb-3">
                <div>
                  <p className="font-medium">{s.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {s.facility?.name} - {s.position || s.employmentType}
                  </p>
                  {s.skills && s.skills.length > 0 && (
                    <div className="mt-1 flex gap-1">
                      {s.skills.map((skill: string, idx: number) => (
                        <span key={idx} className="rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-800">
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">編集</Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
