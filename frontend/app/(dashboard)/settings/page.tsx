'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">設定</h1>
        <p className="text-muted-foreground">システム設定とアカウント管理</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>テナント情報</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tenant-name">テナント名</Label>
            <Input id="tenant-name" placeholder="株式会社サンプル" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tenant-slug">スラッグ</Label>
            <Input id="tenant-slug" placeholder="sample-company" />
          </div>
          <Button>保存</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>施設管理</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            登録されている施設の一覧と管理
          </p>
          <Button>施設を追加</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>制約ルール</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            シフト自動生成時の制約条件を設定
          </p>
          <Button>ルールを追加</Button>
        </CardContent>
      </Card>
    </div>
  );
}
