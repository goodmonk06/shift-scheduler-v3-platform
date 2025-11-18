'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function BillingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">課金管理</h1>
        <p className="text-muted-foreground">プランとお支払い情報</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>現在のプラン</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-2xl font-bold">スタンダードプラン</p>
            <p className="text-sm text-muted-foreground">月額 ¥9,800</p>
          </div>
          <div className="space-y-2 text-sm">
            <p>施設数上限: 3施設</p>
            <p>スタッフ数上限: 50名/施設</p>
            <p>自動シフト生成: 利用可能</p>
          </div>
          <Button>プラン変更</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>お支払い履歴</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Stripe連携により、お支払い履歴を確認できます
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
