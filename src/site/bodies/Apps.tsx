export default function AppsBody() {
  return (
    <div className="body body--apps">
      <p className="denied" role="status">
        ACCESS DENIED
      </p>
      <pre className="denied__log">{`fw.private: deny tcp visitor -> 10.0.5.0/24 eq 443
reason: no credentials presented
policy: private-dashboards (owner only)`}</pre>
      <p>Private dashboards will live behind this firewall. There is nothing public here yet.</p>
    </div>
  )
}
