import dns from "dns";

dns.setServers(["8.8.8.8", "1.1.1.1"]);

dns.promises.resolveSrv("_mongodb._tcp.cluster0.5vubqjp.mongodb.net")
  .then(result => {
    console.log("SRV Result:");
    console.log(result);
  })
  .catch(error => {
    console.error("DNS Error:");
    console.error(error);
  });