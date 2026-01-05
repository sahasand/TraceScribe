"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExtractedProtocol } from "@/lib/api-client";
import {
  AlertTriangle,
  Beaker,
  Calendar,
  ClipboardList,
  Heart,
  Pill,
  Target,
  Users,
} from "lucide-react";

interface ExtractionResultsProps {
  data: ExtractedProtocol;
  confidenceFlags: string[];
}

export function ExtractionResults({
  data,
  confidenceFlags,
}: ExtractionResultsProps) {
  return (
    <div className="space-y-6">
      {/* Confidence Flags */}
      {confidenceFlags.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-yellow-800">
              <AlertTriangle className="h-4 w-4" />
              Sections Needing Review
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {confidenceFlags.map((flag, i) => (
                <Badge key={i} variant="outline" className="bg-yellow-100">
                  {flag}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Study Metadata */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Study Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-4">
            <div>
              <dt className="text-sm text-muted-foreground">Protocol Number</dt>
              <dd className="font-medium">
                {data.metadata.protocol_number || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Phase</dt>
              <dd className="font-medium">{data.metadata.phase || "—"}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Sponsor</dt>
              <dd className="font-medium">{data.metadata.sponsor || "—"}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Indication</dt>
              <dd className="font-medium">{data.metadata.indication || "—"}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* Study Design */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Beaker className="h-5 w-5" />
            Study Design
          </CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-4">
            <div>
              <dt className="text-sm text-muted-foreground">Type</dt>
              <dd className="font-medium">{data.design.study_type}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Blinding</dt>
              <dd className="font-medium">{data.design.blinding || "—"}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">
                Planned Enrollment
              </dt>
              <dd className="font-medium">
                {data.design.planned_enrollment || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Duration</dt>
              <dd className="font-medium">
                {data.design.study_duration_weeks
                  ? `${data.design.study_duration_weeks} weeks`
                  : "—"}
              </dd>
            </div>
          </dl>
          {data.design.arms.length > 0 && (
            <div className="mt-4">
              <dt className="text-sm text-muted-foreground mb-2">Study Arms</dt>
              <div className="flex flex-wrap gap-2">
                {data.design.arms.map((arm, i) => (
                  <Badge key={i} variant="secondary">
                    {arm}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Endpoints */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Endpoints
          </CardTitle>
          <CardDescription>Extracted verbatim from protocol</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.endpoints.primary.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Primary Endpoints</h4>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {data.endpoints.primary.map((ep, i) => (
                  <li key={i}>{ep}</li>
                ))}
              </ul>
            </div>
          )}
          {data.endpoints.secondary.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Secondary Endpoints</h4>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {data.endpoints.secondary.map((ep, i) => (
                  <li key={i}>{ep}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Eligibility */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Eligibility Criteria
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <dt className="text-sm text-muted-foreground">Age Range</dt>
              <dd className="font-medium">
                {data.eligibility.age_range || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Sex</dt>
              <dd className="font-medium">{data.eligibility.sex || "All"}</dd>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2 text-green-700">
                Inclusion Criteria
              </h4>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {data.eligibility.inclusion.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2 text-red-700">
                Exclusion Criteria
              </h4>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {data.eligibility.exclusion.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Investigational Product */}
      {data.investigational_product && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Pill className="h-5 w-5" />
              Investigational Product
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm text-muted-foreground">Name</dt>
                <dd className="font-medium">
                  {data.investigational_product.name}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Type</dt>
                <dd className="font-medium">
                  {data.investigational_product.type || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Route</dt>
                <dd className="font-medium">
                  {data.investigational_product.route || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Dose</dt>
                <dd className="font-medium">
                  {data.investigational_product.dose || "—"}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      )}

      {/* Adverse Events */}
      {data.adverse_events.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              Adverse Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Term</th>
                    <th className="text-left py-2">Plain Language</th>
                    <th className="text-left py-2">Frequency</th>
                    <th className="text-left py-2">Severity</th>
                  </tr>
                </thead>
                <tbody>
                  {data.adverse_events.map((ae, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-2">{ae.term}</td>
                      <td className="py-2">{ae.plain_language || "—"}</td>
                      <td className="py-2">{ae.frequency || "Unknown"}</td>
                      <td className="py-2">{ae.severity || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Visits */}
      {data.visits.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Study Visits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.visits.map((visit, i) => (
                <div key={i} className="border-b last:border-0 pb-4 last:pb-0">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{visit.name}</h4>
                    <span className="text-sm text-muted-foreground">
                      {visit.timing}
                    </span>
                  </div>
                  {visit.procedures.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {visit.procedures.map((proc, j) => (
                        <Badge key={j} variant="outline" className="text-xs">
                          {proc}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
