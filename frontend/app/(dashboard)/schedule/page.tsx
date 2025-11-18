'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Download } from 'lucide-react';
import { api } from '@/lib/api';

export default function SchedulePage() {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleGenerateSchedule = async () => {
    setLoading(true);
    try {
      // 今月の1日から月末までのシフトを生成
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      // 施設IDを取得（仮に最初の施設を使用）
      const facilities = await api.get('/facilities');
      if (facilities.length === 0) {
        alert('施設が登録されていません');
        return;
      }

      const result = await api.post('/scheduler/generate', {
        facilityId: facilities[0].id,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      });

      alert(`シフト生成完了！\n割当数: ${result.assignments.length}\n警告数: ${result.warnings?.length || 0}\nスコア: ${result.score}`);

      // 保存
      await api.post('/scheduler/save', {
        facilityId: facilities[0].id,
        assignments: result.assignments,
      });

      loadAssignments();
    } catch (error: any) {
      alert('シフト生成に失敗しました: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadAssignments = async () => {
    try {
      const data = await api.get('/shift-assignments');
      setAssignments(data);
    } catch (error) {
      console.error('Failed to load assignments:', error);
    }
  };

  useEffect(() => {
    loadAssignments();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">シフト管理</h1>
          <p className="text-muted-foreground">シフトの作成・編集・確認</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            CSV出力
          </Button>
          <Button onClick={handleGenerateSchedule} disabled={loading}>
            <Calendar className="mr-2 h-4 w-4" />
            {loading ? '生成中...' : '自動生成'}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>シフトカレンダー</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              登録されているシフト: {assignments.length}件
            </p>
            {assignments.length > 0 && (
              <div className="max-h-96 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="border-b">
                    <tr>
                      <th className="p-2 text-left">日付</th>
                      <th className="p-2 text-left">スタッフ</th>
                      <th className="p-2 text-left">パターン</th>
                      <th className="p-2 text-left">ステータス</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignments.slice(0, 20).map((assignment) => (
                      <tr key={assignment.id} className="border-b">
                        <td className="p-2">{new Date(assignment.date).toLocaleDateString('ja-JP')}</td>
                        <td className="p-2">{assignment.staff?.name}</td>
                        <td className="p-2">
                          <span
                            className="rounded px-2 py-1 text-xs font-medium text-white"
                            style={{ backgroundColor: assignment.pattern?.color }}
                          >
                            {assignment.pattern?.shortName}
                          </span>
                        </td>
                        <td className="p-2">{assignment.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
