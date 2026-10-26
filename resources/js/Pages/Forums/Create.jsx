import { useForm, Link } from '@inertiajs/react';
import { useState } from 'react';

export default function Create({ course }) {
    const { data, setData, post, processing, errors } = useForm({
        title: '',
        body: '',
        image: null,
    });

    const [imagePreview, setImagePreview] = useState(null);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        setData('image', file);
        
        if (file) {
            setImagePreview(URL.createObjectURL(file));
        } else {
            setImagePreview(null);
        }
    };

    const submit = (e) => {
        e.preventDefault();
        post(`/courses/${course.slug}/forums`, {
            forceFormData: true,
        });
    };

    return (
        <div className="min-h-screen bg-gray-50 py-10 font-sans">
            <div className="max-w-3xl mx-auto px-6">
                
                <div className="mb-8">
                    <Link 
                        href={`/courses/${course.slug}/forums`} 
                        className="text-indigo-600 hover:text-indigo-800 text-sm font-semibold flex items-center gap-2 mb-4 transition-colors"
                    >
                        <span>←</span> Kembali ke Forum
                    </Link>
                    <h1 className="text-3xl font-extrabold text-gray-900">Mulai Diskusi Baru</h1>
                    <p className="text-gray-500 mt-2">Mentok di materi <span className="font-bold text-indigo-600">{course.title}</span>? Ceritakan masalahmu di sini.</p>
                </div>

                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                    <form onSubmit={submit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Judul Pertanyaan <span className="text-red-500">*</span></label>
                            <input 
                                type="text" 
                                value={data.title}
                                onChange={e => setData('title', e.target.value)}
                                placeholder="Contoh: Error 'Undefined variable'"
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500"
                            />
                            {errors.title && <div className="text-red-500 text-sm mt-1">{errors.title}</div>}
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Detail Masalah <span className="text-red-500">*</span></label>
                            <textarea 
                                rows="6"
                                value={data.body}
                                onChange={e => setData('body', e.target.value)}
                                placeholder="Jelaskan secara detail masalahnya..."
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 resize-none"
                            ></textarea>
                            {errors.body && <div className="text-red-500 text-sm mt-1">{errors.body}</div>}
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Lampirkan Screenshot (Opsional)</label>
                            <input 
                                type="file" 
                                onChange={handleImageChange} 
                                accept="image/jpeg,image/png,image/jpg" 
                                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                            />
                            {errors.image && <div className="text-red-500 text-sm mt-1">{errors.image}</div>}
                            
                            {imagePreview && (
                                <div className="mt-4 relative inline-block">
                                    <img src={imagePreview} alt="Preview" className="h-32 object-cover rounded-xl shadow-sm border" />
                                    <button 
                                        type="button"
                                        onClick={() => { setData('image', null); setImagePreview(null); }}
                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs shadow-md"
                                    >
                                        ✕
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="pt-4 flex justify-end">
                            <button 
                                type="submit" 
                                disabled={processing}
                                className={`inline-flex justify-center py-3 px-8 shadow-sm text-base font-bold rounded-xl text-indigo-900 bg-green-400 hover:bg-green-300 transition-all ${processing ? 'opacity-50 cursor-not-allowed' : 'hover:-translate-y-1'}`}
                            >
                                {processing ? 'Mengirim...' : 'Kirim Pertanyaan 🚀'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}