'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { api } from '@/lib/api';

export default function PatternsPage() {
  const [patterns, setPatterns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPatterns();
  }, []);

  const loadPatterns = async () => {
    try {
      const data = await api.get('/shift-patterns');
      setPatterns(data);
    } catch (error) {
      console.error('Failed to load patterns:', error);
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
          <h1 className="text-3xl font-bold">シフトパターン管理</h1>
          <p className="text-muted-foreground">シフトパターンの設定</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          パターン追加
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {patterns.map((pattern) => (
          <Card key={pattern.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{pattern.name}</CardTitle>
                <div
                  className="h-8 w-8 rounded-full"
                  style={{ backgroundColor: pattern.color }}
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="font-medium">時間:</span> {pattern.startTime} - {pattern.endTime}
                </p>
                <p>
                  <span className="font-medium">休憩:</span> {pattern.breakMinutes}分
                </p>
                <p>
                  <span className="font-medium">必要人数:</span> {pattern.requiredStaff}名
                </p>
                {pattern.requiredSkills && pattern.requiredSkills.length > 0 && (
                  <div>
                    <span className="font-medium">必要スキル:</span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {pattern.requiredSkills.map((skill: string, idx: number) => (
                        <span key={idx} className="rounded bg-blue-100 px-2 py-0.5 text-xs">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-4 flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">編集</Button>
                <Button variant="outline" size="sm" className="flex-1">削除</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
