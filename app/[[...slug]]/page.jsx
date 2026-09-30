'use client';
import dynamic from 'next/dynamic';
const Phonebook = dynamic(() => import('../../ui/App.jsx'), { ssr: false });
export default function Page() { return <Phonebook />; }
