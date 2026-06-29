import { useEffect, useState } from "react";
import {
  createAddOn,
  deleteAddOn,
  getAdminAddOns,
  getErrorMessage,
  toggleAddOn,
  updateAddOn,
} from "../../services/api";

const emptyForm = {
  name: "",
  description: "",
  price: "",
  pricing_type: "fixed",
  is_active: true,
};

function AddOnsPage() {
  const [addons, setAddons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editingAddon, setEditingAddon] = useState(null);
  const [formState, setFormState] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [togglingId, setTogglingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadAddOns() {
      setLoading(true);
      setError("");
      try {
        const data = await getAdminAddOns();
        if (!cancelled) setAddons(Array.isArray(data) ? data : data?.items || []);
      } catch (err) {
        if (!cancelled) {
          setAddons([]);
          setError(getErrorMessage(err));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadAddOns();

    return () => {
      cancelled = true;
    };
  }, []);

  async function refreshAddOns() {
    setLoading(true);
    setError("");
    try {
      const data = await getAdminAddOns();
      setAddons(Array.isArray(data) ? data : data?.items || []);
    } catch (err) {
      setAddons([]);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  function handleOpenCreate() {
    setEditingAddon(null);
    setFormState(emptyForm);
    setFormError("");
    setFormOpen(true);
  }

  function handleOpenEdit(addon) {
    setEditingAddon(addon);
    setFormState({
      name: addon.name,
      description: addon.description,
      price: String(addon.price),
      pricing_type: addon.pricing_type,
      is_active: addon.is_active,
    });
    setFormError("");
    setFormOpen(true);
  }

  function handleCloseForm() {
    setFormOpen(false);
    setEditingAddon(null);
  }

  async function handleSubmitForm(event) {
    event.preventDefault();
    setFormError("");

    const price = Number(formState.price);
    if (!formState.name.trim() || !formState.description.trim()) {
      setFormError("Name and description are required.");
      return;
    }
    if (!Number.isFinite(price) || price <= 0) {
      setFormError("Price must be a positive number.");
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        name: formState.name.trim(),
        description: formState.description.trim(),
        price,
        pricing_type: formState.pricing_type,
        is_active: formState.is_active,
      };

      if (editingAddon) {
        await updateAddOn(editingAddon.id, payload);
        setMessage("Add-on updated successfully.");
      } else {
        await createAddOn(payload);
        setMessage("Add-on created successfully.");
      }

      setFormOpen(false);
      setEditingAddon(null);
      await refreshAddOns();
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggle(addon) {
    setTogglingId(addon.id);
    setMessage("");
    setError("");
    try {
      await toggleAddOn(addon.id);
      await refreshAddOns();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDelete(addon) {
    setDeletingId(addon.id);
    setMessage("");
    setError("");
    try {
      await deleteAddOn(addon.id);
      setMessage("Add-on deleted.");
      await refreshAddOns();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center py-24">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-300 border-t-orange-500 dark:border-slate-700 dark:border-t-orange-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Add-ons</h2>
          <p className="mt-1 text-sm text-slate-500">{addons.length} add-on(s)</p>
        </div>

        {!formOpen && (
          <button
            type="button"
            onClick={handleOpenCreate}
            className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-400"
          >
            Add New Add-on
          </button>
        )}
      </div>

      {message && (
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
          {message}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-300">
          {error}
        </div>
      )}

      {formOpen && (
        <form
          onSubmit={handleSubmitForm}
          className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
        >
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            {editingAddon ? `Edit "${editingAddon.name}"` : "New Add-on"}
          </h3>

          {formError && (
            <p className="text-sm text-red-600 dark:text-red-300">{formError}</p>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-slate-500">Name</label>
              <input
                type="text"
                value={formState.name}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, name: event.target.value }))
                }
                placeholder="e.g. Driver Service"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-slate-500">
                Description
              </label>
              <textarea
                value={formState.description}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, description: event.target.value }))
                }
                rows={2}
                placeholder="Short description shown to customers"
                className="w-full resize-none rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Price (PKR)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formState.price}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, price: event.target.value }))
                }
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">
                Pricing Type
              </label>
              <select
                value={formState.pricing_type}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, pricing_type: event.target.value }))
                }
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              >
                <option value="fixed">Fixed (one-time)</option>
                <option value="per_day">Per day</option>
              </select>
            </div>

            <div className="flex items-center gap-2 sm:col-span-2">
              <input
                id="is_active"
                type="checkbox"
                checked={formState.is_active}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, is_active: event.target.checked }))
                }
                className="h-4 w-4 rounded border-slate-300 text-orange-500 focus:ring-orange-400"
              />
              <label htmlFor="is_active" className="text-sm text-slate-700 dark:text-slate-300">
                Active (visible to customers during booking)
              </label>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 border-t border-slate-200 pt-4 dark:border-slate-800">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Saving…" : editingAddon ? "Save Changes" : "Create Add-on"}
            </button>
            <button
              type="button"
              onClick={handleCloseForm}
              disabled={submitting}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-orange-500 hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:text-slate-200"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {addons.length === 0 && !formOpen && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center dark:border-slate-700 dark:bg-slate-900">
          <p className="text-lg font-medium text-slate-700 dark:text-slate-300">
            No add-ons yet
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Create your first add-on (e.g. Driver Service, Insurance, GPS Device).
          </p>
        </div>
      )}

      {addons.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {addons.map((addon) => (
              <li key={addon.id} className="flex flex-wrap items-center justify-between gap-4 p-5">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="font-semibold text-slate-900 dark:text-white">{addon.name}</p>
                    <span
                      className={[
                        "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                        addon.is_active
                          ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-600 dark:text-emerald-300"
                          : "border-slate-400/30 bg-slate-400/15 text-slate-500",
                      ].join(" ")}
                    >
                      {addon.is_active ? "Active" : "Disabled"}
                    </span>
                    <span className="inline-flex rounded-full border border-sky-500/30 bg-sky-500/15 px-2.5 py-0.5 text-xs font-semibold text-sky-600 dark:text-sky-300">
                      {addon.pricing_type === "per_day" ? "Per day" : "Fixed"}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {addon.description}
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-300">
                    PKR {Number(addon.price).toLocaleString()}
                    {addon.pricing_type === "per_day" ? " / day" : ""}
                  </p>
                </div>

                <div className="flex shrink-0 flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(addon)}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-orange-500 hover:text-orange-600 dark:border-slate-600 dark:text-slate-200"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    disabled={togglingId === addon.id}
                    onClick={() => handleToggle(addon)}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-orange-500 hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:text-slate-200"
                  >
                    {togglingId === addon.id
                      ? "Working…"
                      : addon.is_active
                        ? "Disable"
                        : "Enable"}
                  </button>
                  <button
                    type="button"
                    disabled={deletingId === addon.id}
                    onClick={() => handleDelete(addon)}
                    className="rounded-lg border border-red-500/50 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:text-red-300"
                  >
                    {deletingId === addon.id ? "Working…" : "Delete"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default AddOnsPage;
