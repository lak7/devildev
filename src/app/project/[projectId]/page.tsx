"use client";
import { useParams } from "next/navigation";
import { getProject } from "../../../../actions/project";
import { useEffect, useState } from "react";

export default function ProjectPage() {
    const params = useParams();
  const projectId = params?.projectId as string;
  const [project, setProject] = useState<any>(null);

    useEffect(() => {
        const loadProject = async () => {
            const project = await getProject(projectId);
            alert("Project loaded");
            setProject(project);
            console.log(project);
        }
        loadProject();
    }, [projectId]);


  
  return <div>ProjectPage</div>;
}