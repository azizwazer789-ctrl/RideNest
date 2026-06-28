import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createVehicle, getErrorMessage } from '../services/api'
import { getUserFromToken } from '../utils/jwt'

function AddVehicle() {
  const navigate = useNavigate()
  const user = getUserFromToken()

  const [form, setForm] = useState({
    title: '',
    brand: '',
    model: '',
    year: '',
    car_type: '',
    transmission: '',
    fuel_type: '',
    seating_capacity: '',
    city: '',
    location: '',
    price_per_day: '',
    price_per_hour: '',
    with_driver_available: false,
    description: '',
    image_url: '',
  })

  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [loading, setLoading] = useState(false)

  if (!user || user.role !== 'vendor') {
    return (
      <section className="mx-auto max-w-lg py-16 text-center">
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 px-6 py-12">
          <p className="text-lg text-slate-300">Vendor access required.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-6 inline-block rounded-lg bg-emerald-500 px-6 py-3 font-medium text-slate-950 transition hover:bg-emerald-400"
          >
            Go to Dashboard
          </button>
        </div>
      </section>
    )
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm({
      ...form,
      [name]: type === 'checkbox' ? checked : value,
    })
    setFieldErrors({ ...fieldErrors, [name]: '' })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage('')
    setError('')
    setFieldErrors({})
    setLoading(true)

    try {
      await createVehicle({
        ...form,
        year: Number(form.year),
        seating_capacity: Number(form.seating_capacity),
        price_per_day: Number(form.price_per_day),
        price_per_hour: Number(form.price_per_hour),
        image_url: form.image_url || null,
      })

      setMessage('Vehicle added successfully. Waiting for admin approval.')
      setForm({
        title: '',
        brand: '',
        model: '',
        year: '',
        car_type: '',
        transmission: '',
        fuel_type: '',
        seating_capacity: '',
        city: '',
        location: '',
        price_per_day: '',
        price_per_hour: '',
        with_driver_available: false,
        description: '',
        image_url: '',
      })
      setTimeout(() => navigate('/dashboard'), 2000)
    } catch (err) {
      const errMsg = getErrorMessage(err)
      if (Array.isArray(err.response?.data?.detail)) {
        const errors = {}
        err.response.data.detail.forEach(item => {
          if (item.loc && item.loc.length > 1) {
            errors[item.loc[1]] = item.msg
          }
        })
        setFieldErrors(errors)
        setError('Please check the form for errors.')
      } else {
        setError(errMsg)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 sm:p-8">
      <h1 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">Add Vehicle</h1>
      <p className="mt-2 text-slate-600 dark:text-slate-400">Add your car listing for admin approval.</p>

        {message && (
          <div className="mb-6 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            {message}
          </div>
        )}
        {error && (
          <div className="mb-6 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            ['title', 'Title', 'text'],
            ['brand', 'Brand', 'text'],
            ['model', 'Model', 'text'],
            ['year', 'Year', 'number'],
            ['car_type', 'Car Type', 'text'],
            ['transmission', 'Transmission', 'text'],
            ['fuel_type', 'Fuel Type', 'text'],
            ['seating_capacity', 'Seating Capacity', 'number'],
            ['city', 'City', 'text'],
            ['location', 'Location', 'text'],
            ['price_per_day', 'Price Per Day', 'number'],
            ['price_per_hour', 'Price Per Hour', 'number'],
            ['image_url', 'Image URL (optional)', 'text'],
          ].map(([name, label, type]) => (
            <div key={name}>
              <input
                name={name}
                type={type}
                placeholder={label}
                value={form[name]}
                onChange={handleChange}
                required={name !== 'image_url'}
                step={type === 'number' && (name.includes('price') || name === 'year') ? '0.01' : undefined}
                className={`w-full rounded-lg px-4 py-3 outline-none transition ${
                  fieldErrors[name]
                    ? 'border border-red-500 bg-red-500/5 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                    : 'border border-slate-700 bg-slate-950 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400'
                } text-white placeholder-slate-500`}
              />
              {fieldErrors[name] && (
                <p className="mt-1 text-sm text-red-400">{fieldErrors[name]}</p>
              )}
            </div>
          ))}

          <div className="md:col-span-2">
            <textarea
              name="description"
              placeholder="Description"
              value={form.description}
              onChange={handleChange}
              required
              className={`w-full rounded-lg px-4 py-3 outline-none transition ${
                fieldErrors.description
                  ? 'border border-red-500 bg-red-500/5 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                  : 'border border-slate-700 bg-slate-950 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400'
              } text-white placeholder-slate-500`}
              rows="4"
            />
            {fieldErrors.description && (
              <p className="mt-1 text-sm text-red-400">{fieldErrors.description}</p>
            )}
          </div>

          <label className="md:col-span-2 flex items-center gap-3 text-slate-300">
            <input
              type="checkbox"
              name="with_driver_available"
              checked={form.with_driver_available}
              onChange={handleChange}
              className="rounded border-slate-700 text-emerald-500"
            />
            With driver available
          </label>

          <button
            type="submit"
            disabled={loading}
            className="md:col-span-2 bg-emerald-500 text-black font-semibold py-3 rounded-lg hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60 transition"
          >
            {loading ? 'Adding Vehicle...' : 'Add Vehicle'}
          </button>
        </form>
    </div>
  );
}

export default AddVehicle