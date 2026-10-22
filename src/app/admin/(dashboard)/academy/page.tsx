// src/app/admin/(dashboard)/academy/page.tsx
import { db } from "@/lib/db";
import { PageHeader } from "@/components/admin/ui";
import { CurriculumModal } from "@/components/admin/CurriculumModal";
import { EnrollmentStatusSelect } from "@/components/admin/EnrollmentStatusSelect";

export const dynamic = "force-dynamic";

export default async function AdminAcademyPage() {
  const courses = await db.academyCourse.findMany({
    include: { modules: { orderBy: { order: "asc" } }, enrollments: { include: { user: { select: { name: true, email: true } } }, orderBy: { createdAt: "desc" } } },
  });

  return (
    <>
      <PageHeader eyebrow="Education" title="Academy" />

      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        {courses.map((c) => (
          <div key={c.id} className="p-5 rounded-xl2 border border-forest-100 bg-cream-50 shadow-sm">
            <h3 className="font-display font-semibold text-forest-800">{c.title}</h3>
            <div className="flex gap-4 mt-2 text-xs text-ink-soft">
              {c.durationWeeks && <span>{c.durationWeeks} weeks</span>}
              <span>{c.modules.length} modules</span>
              <span>{c.enrollments.length} students</span>
            </div>
            <CurriculumModal
              courseId={c.id}
              courseTitle={c.title}
              initialModules={c.modules.map((m) => ({ id: m.id, title: m.title, order: m.order }))}
            />
          </div>
        ))}
      </div>

      <h3 className="font-display font-semibold text-forest-800 mb-3">Enrollments</h3>
      <div className="rounded-xl2 border border-forest-100 bg-cream-50 overflow-x-auto shadow-sm">
        <table className="w-full text-sm min-w-[560px]">
          <thead>
            <tr className="text-left text-xs text-ink-soft uppercase tracking-wide border-b border-forest-100">
              <th className="p-4">Student</th>
              <th className="p-4">Tier</th>
              <th className="p-4">Enrolled</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {courses.flatMap((c) => c.enrollments).map((e: any) => (
              <tr key={e.id} className="border-b border-forest-100 last:border-0">
                <td className="p-4"><p className="font-medium">{e.user?.name || "—"}</p><p className="text-xs font-mono text-ink-soft">{e.user?.email}</p></td>
                <td className="p-4 text-xs">{e.tier === "MENTORSHIP_TRAINING" ? "Mentorship + Training" : "Video Training Only"}</td>
                <td className="p-4 font-mono text-xs">{new Date(e.createdAt).toLocaleDateString()}</td>
                <td className="p-4">
                  <EnrollmentStatusSelect id={e.id} initial={e.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
