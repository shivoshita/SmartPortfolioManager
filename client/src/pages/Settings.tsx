import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Settings as SettingsIcon, Bell, Shield, Palette, Database, Download } from "lucide-react";

export default function Settings() {
  const [notifications, setNotifications] = useState({
    priceAlerts: true,
    dailySummary: true,
    weeklyReport: false,
    marketNews: true,
  });

  const [preferences, setPreferences] = useState({
    currency: 'USD',
    dateFormat: 'MM/DD/YYYY',
    theme: 'light',
    refreshInterval: '5',
  });

  const handleNotificationChange = (key: string, value: boolean) => {
    setNotifications(prev => ({ ...prev, [key]: value }));
    console.log(`${key} notifications ${value ? 'enabled' : 'disabled'}`);
  };

  const handlePreferenceChange = (key: string, value: string) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
    console.log(`${key} changed to ${value}`);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account preferences and application settings.
        </p>
      </div>

      {/* Account Settings */}
      <Card className="hover-elevate">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2 text-primary" />
            Account Settings
          </CardTitle>
          <CardDescription>
            Manage your account information and security settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input 
                id="email" 
                type="email" 
                defaultValue="user@example.com" 
                data-testid="input-email"
              />
            </div>
            <div>
              <Label htmlFor="username">Username</Label>
              <Input 
                id="username" 
                type="text" 
                defaultValue="portfoliouser" 
                data-testid="input-username"
              />
            </div>
          </div>
          
          <Separator />
          
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-medium">Two-Factor Authentication</h4>
              <p className="text-sm text-muted-foreground">
                Add an extra layer of security to your account
              </p>
            </div>
            <Badge variant="outline">Disabled</Badge>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" data-testid="button-change-password">
              Change Password
            </Button>
            <Button variant="outline" data-testid="button-enable-2fa">
              Enable 2FA
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card className="hover-elevate">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bell className="h-5 w-5 mr-2 text-primary" />
            Notifications
          </CardTitle>
          <CardDescription>
            Control how and when you receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(notifications).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <div>
                <Label htmlFor={key} className="text-sm font-medium">
                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {key === 'priceAlerts' && 'Get notified when stock prices hit your targets'}
                  {key === 'dailySummary' && 'Daily portfolio performance summary'}
                  {key === 'weeklyReport' && 'Weekly portfolio analysis report'}
                  {key === 'marketNews' && 'Important market news and updates'}
                </p>
              </div>
              <Switch
                id={key}
                checked={value}
                onCheckedChange={(checked) => handleNotificationChange(key, checked)}
                data-testid={`switch-${key}`}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Display Preferences */}
      <Card className="hover-elevate">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Palette className="h-5 w-5 mr-2 text-primary" />
            Display Preferences
          </CardTitle>
          <CardDescription>
            Customize how your dashboard looks and behaves
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="currency">Currency</Label>
              <Select 
                value={preferences.currency} 
                onValueChange={(value) => handlePreferenceChange('currency', value)}
              >
                <SelectTrigger data-testid="select-currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                  <SelectItem value="JPY">JPY (¥)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="dateFormat">Date Format</Label>
              <Select 
                value={preferences.dateFormat} 
                onValueChange={(value) => handlePreferenceChange('dateFormat', value)}
              >
                <SelectTrigger data-testid="select-date-format">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                  <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                  <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="theme">Theme</Label>
              <Select 
                value={preferences.theme} 
                onValueChange={(value) => handlePreferenceChange('theme', value)}
              >
                <SelectTrigger data-testid="select-theme">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="auto">System</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="refreshInterval">Data Refresh (seconds)</Label>
              <Select 
                value={preferences.refreshInterval} 
                onValueChange={(value) => handlePreferenceChange('refreshInterval', value)}
              >
                <SelectTrigger data-testid="select-refresh-interval">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 seconds</SelectItem>
                  <SelectItem value="30">30 seconds</SelectItem>
                  <SelectItem value="60">1 minute</SelectItem>
                  <SelectItem value="300">5 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card className="hover-elevate">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="h-5 w-5 mr-2 text-primary" />
            Data Management
          </CardTitle>
          <CardDescription>
            Export, backup, and manage your portfolio data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="flex items-center justify-center" data-testid="button-export-data">
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
            <Button variant="outline" className="flex items-center justify-center" data-testid="button-backup-settings">
              <Database className="h-4 w-4 mr-2" />
              Backup Settings
            </Button>
            <Button variant="destructive" data-testid="button-clear-data">
              Clear All Data
            </Button>
          </div>
          
          <Separator />
          
          <div className="bg-muted/30 rounded-lg p-4">
            <h4 className="font-medium mb-2">Data Usage</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex justify-between">
                <span>Portfolio Holdings:</span>
                <span>5 stocks</span>
              </div>
              <div className="flex justify-between">
                <span>Historical Data:</span>
                <span>12 months</span>
              </div>
              <div className="flex justify-between">
                <span>Storage Used:</span>
                <span>2.4 MB</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Settings */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" data-testid="button-reset-settings">
          Reset to Defaults
        </Button>
        <Button data-testid="button-save-settings">
          Save Changes
        </Button>
      </div>
    </div>
  );
}