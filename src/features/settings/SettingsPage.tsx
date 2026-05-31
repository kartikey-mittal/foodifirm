import { useState, useEffect } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/context/AuthContext';
import { updateBusiness, updateBusinessSlug, getBusinessBySlug } from '@/services/businessService';
import { updateUserProfile } from '@/services/userService';
import { createSlugFromName } from '@/utils/slug';
import { Link, Copy, Upload, Store, Save, Loader2, ExternalLink, Globe, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

export function SettingsPage() {
  const { appUser, business, refreshBusiness } = useAuth();
  const [saving, setSaving] = useState(false);
  const [slugSaving, setSlugSaving] = useState(false);
  const [slugValue, setSlugValue] = useState('');
  const [slugError, setSlugError] = useState('');
  const [form, setForm] = useState({
    businessName: '',
    businessPhone: '',
    businessEmail: '',
    businessAddress: '',
    city: '',
    area: '',
    currency: 'INR',
    timezone: 'Asia/Kolkata',
  });

  useEffect(() => {
    if (business) {
      setForm({
        businessName: business.businessName || '',
        businessPhone: business.businessPhone || '',
        businessEmail: business.businessEmail || '',
        businessAddress: business.businessAddress || '',
        city: business.city || '',
        area: business.area || '',
        currency: business.currency || 'INR',
        timezone: business.timezone || 'Asia/Kolkata',
      });
      setSlugValue(business.slug || createSlugFromName(business.businessName || 'store'));
    }
  }, [business]);

  const handleSave = async () => {
    if (!business?.id) return;
    setSaving(true);
    try {
      await updateBusiness(business.id, form);
      await refreshBusiness();
      toast.success('Business profile updated!');
    } catch (err) {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const updateForm = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const handleSlugSave = async () => {
    if (!business?.id) return;
    const slug = slugValue.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    if (!slug) { setSlugError('Slug cannot be empty'); return; }
    if (slug.length < 3) { setSlugError('Slug must be at least 3 characters'); return; }

    setSlugSaving(true);
    setSlugError('');
    try {
      const existing = await getBusinessBySlug(slug);
      if (existing && existing.id !== business.id) {
        setSlugError('This slug is already taken by another store');
        return;
      }
      await updateBusinessSlug(business.id, slug);
      setSlugValue(slug);
      await refreshBusiness();
      toast.success('Store URL slug updated!');
    } catch (err) {
      toast.error('Failed to update slug');
    } finally {
      setSlugSaving(false);
    }
  };

  const generateSlug = () => {
    const s = createSlugFromName(form.businessName || 'store');
    setSlugValue(s);
    setSlugError('');
  };

  const storeId = business?.id || '';
  const storeSlug = business?.slug || slugValue;
  const baseUrl = `${window.location.origin}/store`;
  const portalLinks = storeId ? {
    idUrl: `${baseUrl}/${storeId}`,
    slugUrl: storeSlug ? `${baseUrl}/${storeSlug}` : null,
    customerRegistration: `${baseUrl}/${storeId}/register`,
    customerLogin: `${baseUrl}/${storeId}/customer-login`,
    customerPortal: `${baseUrl}/${storeId}/customer-portal`,
    driverAccess: `${baseUrl}/${storeId}/driver`,
  } : null;

  return (
    <PageContainer title="Settings" description="Manage your business profile, store URL, and account.">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900">Business Profile</h2>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                  <Store className="h-8 w-8" />
                </div>
                <div>
                  <Button variant="outline" size="sm" icon={<Upload className="h-4 w-4" />} disabled>
                    Upload Logo
                  </Button>
                  <p className="text-xs text-gray-400 mt-1">Coming soon</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Business Name" value={form.businessName} onChange={(e) => updateForm('businessName', e.target.value)} />
                <Input label="Business Phone" value={form.businessPhone} onChange={(e) => updateForm('businessPhone', e.target.value)} />
                <Input label="Business Email" type="email" value={form.businessEmail} onChange={(e) => updateForm('businessEmail', e.target.value)} />
                <Input label="City" value={form.city} onChange={(e) => updateForm('city', e.target.value)} />
                <Input label="Area" value={form.area} onChange={(e) => updateForm('area', e.target.value)} />
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">Currency</label>
                  <select value={form.currency} onChange={(e) => updateForm('currency', e.target.value)} className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm">
                    <option value="INR">INR - ₹</option>
                    <option value="USD">USD - $</option>
                  </select>
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Timezone</label>
                  <select value={form.timezone} onChange={(e) => updateForm('timezone', e.target.value)} className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm">
                    <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                    <option value="Asia/Dubai">Asia/Dubai</option>
                    <option value="UTC">UTC</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <Input label="Address" value={form.businessAddress} onChange={(e) => updateForm('businessAddress', e.target.value)} />
                </div>
              </div>

              <Button loading={saving} icon={<Save className="h-4 w-4" />} onClick={handleSave}>Save Changes</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900">Store URL (Slug)</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-500">Both URLs below work. Share the slug one (cleaner) with customers.</p>
              <div className="space-y-2">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Slug URL (recommended)</label>
                  <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm">
                    <Globe className="h-4 w-4 text-emerald-500" />
                    <span className="text-gray-400">{window.location.origin}/store/</span>
                    <span className="font-medium text-emerald-700">{storeSlug}</span>
                    {!business?.slug && <span className="text-xs text-amber-500">(save slug below)</span>}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Store ID URL</label>
                  <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
                    <Globe className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-400">{window.location.origin}/store/</span>
                    <span className="font-medium text-gray-700">{storeId}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Edit Slug</label>
                  <div className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm">
                    <span className="text-gray-400">/</span>
                    <input
                      value={slugValue}
                      onChange={(e) => { setSlugValue(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')); setSlugError(''); }}
                      className="flex-1 outline-none bg-transparent text-gray-900"
                      placeholder="your-store-slug"
                    />
                    <button onClick={generateSlug} title="Generate from business name" className="text-gray-400 hover:text-gray-600">
                      <RefreshCw className="h-4 w-4" />
                    </button>
                  </div>
                  {slugError && <p className="text-xs text-red-500 mt-1">{slugError}</p>}
                </div>
                <Button size="sm" loading={slugSaving} onClick={handleSlugSave}>Update</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900">Customer Portal Links</h2>
              <p className="text-sm text-gray-500">Share these links with your customers</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {portalLinks ? (
                <>
                  <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-emerald-600" />
                        <span className="font-medium text-gray-900 text-sm">Slug URL</span>
                      </div>
                      <Badge variant="success">Recommended</Badge>
                    </div>
                    <p className="text-xs text-gray-500 mb-2 break-all">
                      {portalLinks.slugUrl ? `${portalLinks.slugUrl}/register` : 'Set slug above'}
                    </p>
                    {portalLinks.slugUrl && (
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" icon={<Copy className="h-3.5 w-3.5" />} onClick={() => copyToClipboard(`${portalLinks.slugUrl}/register`)}>Copy</Button>
                        <Button variant="ghost" size="sm" icon={<ExternalLink className="h-3.5 w-3.5" />} onClick={() => window.open(`${portalLinks.slugUrl}/register`, '_blank')}>Open</Button>
                      </div>
                    )}
                  </div>
                  <div className="rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Link className="h-4 w-4 text-emerald-600" />
                        <span className="font-medium text-gray-900 text-sm">Customer Registration</span>
                      </div>
                      <Badge variant="success">Active</Badge>
                    </div>
                    <p className="text-xs text-gray-400 mb-2 break-all">{portalLinks.customerRegistration}</p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" icon={<Copy className="h-3.5 w-3.5" />} onClick={() => copyToClipboard(portalLinks.customerRegistration)}>Copy</Button>
                      <Button variant="ghost" size="sm" icon={<ExternalLink className="h-3.5 w-3.5" />} onClick={() => window.open(portalLinks.customerRegistration, '_blank')}>Open</Button>
                    </div>
                  </div>
                  <div className="rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Link className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-gray-900 text-sm">Customer Login</span>
                      </div>
                      <Badge variant="info">Active</Badge>
                    </div>
                    <p className="text-xs text-gray-400 mb-2 break-all">{portalLinks.customerLogin}</p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" icon={<Copy className="h-3.5 w-3.5" />} onClick={() => copyToClipboard(portalLinks.customerLogin)}>Copy</Button>
                      <Button variant="ghost" size="sm" icon={<ExternalLink className="h-3.5 w-3.5" />} onClick={() => window.open(portalLinks.customerLogin, '_blank')}>Open</Button>
                    </div>
                  </div>
                  <div className="rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Link className="h-4 w-4 text-indigo-600" />
                        <span className="font-medium text-gray-900 text-sm">Customer Portal</span>
                      </div>
                      <Badge variant="info">Active</Badge>
                    </div>
                    <p className="text-xs text-gray-400 mb-2 break-all">{portalLinks.customerPortal}</p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" icon={<Copy className="h-3.5 w-3.5" />} onClick={() => copyToClipboard(portalLinks.customerPortal)}>Copy</Button>
                      <Button variant="ghost" size="sm" icon={<ExternalLink className="h-3.5 w-3.5" />} onClick={() => window.open(portalLinks.customerPortal, '_blank')}>Open</Button>
                    </div>
                  </div>
                  <div className="rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Link className="h-4 w-4 text-amber-600" />
                        <span className="font-medium text-gray-900 text-sm">Driver Access</span>
                      </div>
                      <Badge variant="info">Active</Badge>
                    </div>
                    <p className="text-xs text-gray-400 mb-2 break-all">{portalLinks.driverAccess}</p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" icon={<Copy className="h-3.5 w-3.5" />} onClick={() => copyToClipboard(portalLinks.driverAccess)}>Copy</Button>
                      <Button variant="ghost" size="sm" icon={<ExternalLink className="h-3.5 w-3.5" />} onClick={() => window.open(portalLinks.driverAccess, '_blank')}>Open</Button>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-sm text-gray-400 text-center py-4">Save business profile to generate portal links</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900">Account Information</h2>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-600">Full Name</span>
                <span className="text-sm font-medium text-gray-900">{appUser?.fullName || '-'}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-t border-gray-50">
                <span className="text-sm text-gray-600">Email</span>
                <span className="text-sm font-medium text-gray-900">{appUser?.email || '-'}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-t border-gray-50">
                <span className="text-sm text-gray-600">User Type</span>
                <Badge variant="info">{appUser?.userType?.replace('_', ' ') || '-'}</Badge>
              </div>
              <div className="flex items-center justify-between py-2 border-t border-gray-50">
                <span className="text-sm text-gray-600">Plan</span>
                <Badge variant="success">{business?.subscriptionPlan || 'Premium'}</Badge>
              </div>
              <div className="flex items-center justify-between py-2 border-t border-gray-50">
                <span className="text-sm text-gray-600">Store ID</span>
                <span className="text-xs font-mono text-gray-400">{business?.id || '-'}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text);
  toast.success('Link copied!');
}
